from setuptools import setup, find_packages

setup(
    name='gateway_api',
    version='1.0.0',
    description='My Blog API Gateway',
    author='DarkGoldBar',
    author_email='',
    install_requires=[
        "fastapi",
        "pydantic",
        "uvicorn",
        "boto3",
    ],
    packages=find_packages()
)
