import pandas as pd
import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

model = LogisticRegression()
df = pd.read_csv('model/framingham.csv')
df = df.dropna()
df.fillna(method='bfill', inplace=True)
data = df[28:30]

y = data["TenYearCHD"]
X = data.drop(columns=['TenYearCHD', 'education'], axis=1)
# X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.30, random_state=0)
scaler = StandardScaler()
X_train = scaler.fit_transform(X)

model.fit(X_train, y)

print(model.coef_)
print(model.intercept_)
print(model.classes_)