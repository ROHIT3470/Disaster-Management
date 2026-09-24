import os
from pymongo import MongoClient
from urllib.parse import quote_plus
import bcrypt
import uuid
from fastapi import FastAPI as fa
app=fa()


mongo_uri = os.getenv("MONGODB_URI")
if not mongo_uri:
    raise RuntimeError("MONGODB_URI is required to run the user-data service.")

clint = MongoClient(mongo_uri)

db = clint["AI"]
Table = db["User"]

# user register in database

@app.post("/register")
def create_std(data:dict):
    password=data["password"]
    password_byte=password.encode("utf-8")
    password_hash=bcrypt.hashpw(password_byte, bcrypt.gensalt())
    data["password"]=password_hash.decode("utf-8")

    # for token generation
    token=str(uuid.uuid4())
    data["token"]=token
    # end token generation

    re=Table.insert_one(data)
    return{
        "status":True,
        "message":"student registered successfully",
        "id":str(re.inserted_id)
    }

#login with email and password

@app.post("/login")
def register_student(data: dict):
    email=data["email"]
    password=data["password"]
    re=Table.find_one({"email":email})
    
    if not re:
        return {
                "status":False,
                "message":"invalid email or password",

            }
    password_byte=password.encode("utf-8")
    re_password=re["password"].encode("utf-8")
    password_correct=bcrypt.checkpw(
        password_byte,
        re_password
        )

    if not password_correct:
        return {
                "status":False,
                "message":"invalid password",

            }
    return {
        "status":True,
        "message":"login successfully",
        "id":str(re["_id"])
    }

# delete

@app.delete("/delete")
def delete_student(data: dict):
    result = Table.delete_one({"email": data["email"]})

    return {
        "status": result.deleted_count > 0,
        "message": "Student deleted successfully" if result.deleted_count else "Student not found"
    }


# search student

@app.get("/search")
def get_students(data: dict):
    re=Table.find_one({"email":data["email"]})
    if re:
        print("Students details:")
        print("Name:", re["name"])
        print("Email:", re["email"])
        print("Age:", re["age"])
        print("Course:", re["course"])
        return {
            "status": True,
            "message": "Student details printed in terminal"
            }
    else:
        return {
        "status": False,
        "message": "Student not found"
    }


# update password
from pydantic import BaseModel


class PasswordUpdate(BaseModel):
    email: str
    old_password: str
    new_password: str


@app.patch("/update/password")
def update_password(data: PasswordUpdate):

    user = Table.find_one({"email": data.email})

    if not user:
        return {
            "status": False,
            "message": "Invalid email or password"
        }

    password_correct = bcrypt.checkpw(
        data.old_password.encode("utf-8"),
        user["password"].encode("utf-8")
    )

    if not password_correct:
        return {
            "status": False,
            "message": "Invalid password"
        }

    new_password_hash = bcrypt.hashpw(
        data.new_password.encode("utf-8"),
        bcrypt.gensalt()
    )

    result = Table.update_one(
        {"email": data.email},
        {
            "$set": {
                "password": new_password_hash.decode("utf-8")
            }
        }
    )

    return {
        "status": result.modified_count > 0,
        "message": "Password updated successfully"
    }