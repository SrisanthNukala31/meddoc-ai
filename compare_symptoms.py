
import pickle
import json
import os

base_path = os.path.join('c:', os.sep, 'Users', 'srisa', 'OneDrive', 'Desktop', 'meddoc-ai')
ml_path = os.path.join(base_path, 'ml')
data_path = os.path.join(base_path, 'src', 'data')

with open(os.path.join(ml_path, 'feature_columns.pkl'), 'rb') as f:
    features = pickle.load(f)

with open(os.path.join(data_path, 'symptoms.json'), 'r') as f:
    json_symptoms = json.load(f)

print(f"Features in PKL: {len(features)}")
print(f"Symptoms in JSON: {len(json_symptoms)}")

missing_in_json = [f for f in features if f not in json_symptoms]
missing_in_pkl = [s for s in json_symptoms if s not in features]

print(f"Missing in JSON: {len(missing_in_json)}")
print(f"Missing in PKL: {len(missing_in_pkl)}")

if missing_in_json:
    print(f"First 10 missing in JSON: {missing_in_json[:10]}")
