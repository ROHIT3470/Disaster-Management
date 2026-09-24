#!/usr/bin/env python3
"""
Python script for downloading data from the NASA CMR API

Requirements:
    > pip install tqdm

To run the script: `python download_files_GPM_3IMERGDF_07.py`
"""

import os
import argparse
from pathlib import Path
import requests
from tqdm import tqdm
from concurrent.futures import ThreadPoolExecutor, as_completed

CMR_BASE_URL = "https://cmr.earthdata.nasa.gov"

SHORT_NAME = "GPM_3IMERGDF"
VERSION = "07"
FILTER_TEMPORAL = "2025-08-31T00:00:00.000Z,2025-09-30T23:59:59.000Z"
FILTER_BBOX = "91.55,25.95,91.9,26.3"
FILTER_SEARCH = ""
FILTER_CLOUD_COVER_MIN = ""
FILTER_CLOUD_COVER_MAX = ""
DOWNLOAD_DIR = f"./{SHORT_NAME}_{VERSION}"
MAX_WORKERS = 5


def query_cmr_granules(
    short_name: str,
    version: str,
    page_size: int = 2000,
    search_after: str | None = None,
    **extra_params,
):
    """
    Queries the CMR granules endpoint.

    Args:
        short_name: The short name of the collection
        version: The version of the collection
        page_size: The number of results per page (max is 2000)
        search_after: The pagination token for subsequent requests (optional, see https://cmr.earthdata.nasa.gov/search/site/docs/search/api.html#search-after for more details)
        **extra_params: Additional query parameters (e.g., temporal, bounding_box, etc.)

    Returns:
        tuple: (response object, list of granule items)
    """
    url = f"{CMR_BASE_URL}/search/granules.umm_json"

    params = {
        "short_name": short_name,
        "version": version,
        "page_size": page_size,
        **extra_params,  # Merge any additional parameters
    }

    headers = {"Accept": "application/json"}
    if search_after:
        headers["CMR-Search-After"] = search_after

    response = requests.get(url, params=params, headers=headers, timeout=30)
    response.raise_for_status()

    data = response.json()
    items = data.get("items", [])

    return response, items


def _download_one(url: str, download_dir: str):
    filename = os.path.basename(url.split("?", 1)[0])
    if not filename:
        return "failed", filename, "The NASA response contained an empty filename."

    local_filename = Path(download_dir) / filename
    if local_filename.exists():
        return "skipped", filename, None

    try:
        import earthaccess

        earthaccess.download([url], local_path=download_dir)
        return "downloaded", filename, None
    except ModuleNotFoundError:
        return "failed", filename, "Install dependencies with: python -m pip install -r requirements.txt"
    except Exception as error:
        return "failed", filename, str(error)


def download_data_from_cmr(
    short_name: str,
    version: str,
    total_granules: int,
    page_size: int = 2000,
    download_dir: str = DOWNLOAD_DIR,
    max_workers: int = MAX_WORKERS,
    **params,
):
    """Fetch granules from CMR and download them using earthaccess."""

    Path(download_dir).mkdir(parents=True, exist_ok=True)
    search_after_value: str | None = None
    all_download_urls: set[str] = set()
    granules_without_urls = 0

    print("Collecting download URLs...")

    with tqdm(total=total_granules, desc="Collecting URLs", unit="granule") as pbar:
        while True:
            response, items = query_cmr_granules(
                short_name, version, page_size, search_after_value, **params
            )

            for item in items:
                pbar.update(1)

                download_urls = []

                for related_url in item.get("umm", {}).get("RelatedUrls", []):
                    if related_url.get("Type") == "GET DATA":
                        url = related_url.get("URL")
                        if url:
                            download_urls.append(url)

                if download_urls:
                    all_download_urls.update(download_urls)
                else:
                    granules_without_urls += 1

            search_after_value = response.headers.get("CMR-Search-After")

            if not search_after_value:
                break

    print(f"Found {len(all_download_urls)} files to download")

    if granules_without_urls > 0:
        print(f"⚠️ {granules_without_urls} granules have no download URLs")

    downloaded_count = 0
    skipped_count = 0
    failed_count = 0

    with ThreadPoolExecutor(max_workers=max(1, max_workers)) as executor:
        jobs = {
            executor.submit(_download_one, url, download_dir): url
            for url in all_download_urls
        }
        for job in tqdm(as_completed(jobs), total=len(jobs), desc="Downloading files", unit="file"):
            status, filename, error = job.result()
            if status == "downloaded":
                downloaded_count += 1
                print(f"✅ Downloaded: {filename}")
            elif status == "skipped":
                skipped_count += 1
                print(f"⏭️ Already exists: {filename}")
            else:
                failed_count += 1
                print(f"⚠️ Failed: {filename}\n   {error}")

    print(f"Downloaded: {downloaded_count} files")

    if skipped_count > 0:
        print(f"Skipped: {skipped_count} files (already exist)")

    if failed_count > 0:
        print(f"Failed: {failed_count} files")




def fetch_total_granules_count_from_cmr(short_name: str, version: str, **params):
    """Fetches the total number of granules for a given collection and filters from the CMR API"""
    response, _ = query_cmr_granules(short_name, version, page_size=1, **params)
    data = response.json()
    return data.get("hits", 0)


def parse_args():
    parser = argparse.ArgumentParser(description="Download NASA GPM IMERG granules.")
    parser.add_argument("--start", default=FILTER_TEMPORAL.split(",", 1)[0])
    parser.add_argument("--end", default=FILTER_TEMPORAL.split(",", 1)[1])
    parser.add_argument("--bbox", default=FILTER_BBOX)
    parser.add_argument("--output-dir", default=DOWNLOAD_DIR)
    parser.add_argument("--workers", type=int, default=MAX_WORKERS)
    return parser.parse_args()


def main():
    """Main function to download data from the CMR API"""
    args = parse_args()
    try:
        import earthaccess
    except ModuleNotFoundError as error:
        raise SystemExit(
            "earthaccess is required for NASA downloads. "
            "Install dependencies with: python -m pip install -r requirements.txt"
        ) from error

    earthaccess.login(strategy="environment")

    filter_params = {}

    if args.start and args.end:
        filter_params["temporal"] = f"{args.start},{args.end}"

    if args.bbox:
        filter_params["bounding_box"] = args.bbox

    if FILTER_SEARCH:
        filter_params["producer_granule_id[]"] = FILTER_SEARCH
        filter_params["options[producer_granule_id][pattern]"] = 'true'

    if FILTER_CLOUD_COVER_MIN and FILTER_CLOUD_COVER_MAX:
        filter_params["cloud_cover"] = f"{FILTER_CLOUD_COVER_MIN},{FILTER_CLOUD_COVER_MAX}"

    total_granules = fetch_total_granules_count_from_cmr(
        SHORT_NAME, VERSION, **filter_params
    )
    print(f"Total granules: {total_granules:,}")

    download_data_from_cmr(
        SHORT_NAME,
        VERSION,
        total_granules,
        download_dir=args.output_dir,
        max_workers=args.workers,
        **filter_params,
    )

    print("✅ All downloads complete.")


if __name__ == "__main__":
    main()
