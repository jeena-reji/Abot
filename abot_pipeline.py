import requests
import time
import os

ABOT_BASE_URL = "https://abot.example.com" # Replace with your ABot host

def get_auth_token():
url = f"{ABOT_BASE_URL}/api/auth/token"
data = {
"username": os.environ.get("ABOT_USERNAME"),
"password": os.environ.get("ABOT_PASSWORD")
}
response = requests.post(url, json=data)
response.raise_for_status()
token = response.json().get("token")
print("Logged in to ABot")
return token

def get_feature_tags(token):
url = f"{ABOT_BASE_URL}/api/features/tags"
headers = {"Authorization": f"Bearer {token}"}
response = requests.get(url, headers=headers)
response.raise_for_status()
tags = response.json()
print(f"📋 Available tags: {tags}")
return tags

def start_execution(token, tag):
url = f"{ABOT_BASE_URL}/api/execute"
data = {"feature_tag": tag}
headers = {"Authorization": f"Bearer {token}"}
response = requests.post(url, json=data, headers=headers)
response.raise_for_status()
exec_id = response.json().get("execution_id")
print(f"🚀 Execution started. ID: {exec_id}")
return exec_id

def wait_for_completion(token, exec_id):
url = f"{ABOT_BASE_URL}/api/status/{exec_id}"
headers = {"Authorization": f"Bearer {token}"}
while True:
res = requests.get(url, headers=headers).json()
status = res.get("status", "")
print(f"⏳ Current Status: {status}")
if status == "COMPLETED":
print("Execution completed.")
break
time.sleep(10)

def get_results(token, exec_id):
url = f"{ABOT_BASE_URL}/api/results/{exec_id}"
headers = {"Authorization": f"Bearer {token}"}
response = requests.get(url, headers=headers)
response.raise_for_status()
print(" Test Results Summary:")
print(response.json())

def download_logs(token, exec_id):
url = f"{ABOT_BASE_URL}/api/logs/{exec_id}"
headers = {"Authorization": f"Bearer {token}"}
response = requests.get(url, headers=headers)
os.makedirs("abot_logs", exist_ok=True)
with open("abot_logs/logs.txt", "wb") as f:
f.write(response.content)
print("Logs saved to abot_logs/logs.txt")

if name == "main":
token = get_auth_token()
tags = get_feature_tags(token)
if not tags:
print("No tags available. Exiting.")
exit(1)
selected_tag = tags[0] # You can customize this
exec_id = start_execution(token, selected_tag)
wait_for_completion(token, exec_id)
get_results(token, exec_id)
download_logs(token, exec_id)
