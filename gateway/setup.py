from setuptools import setup, find_packages

setup(
    name='gateway_api',
    version='1.0.0',
    description='My Blog API Gateway',
    author='DarkGoldBar',
    author_email='',
    install_requires=[
        "fastapi",
        "uvicorn",
        "boto3",
        "pydantic[email]",
    ],
    packages=find_packages()
)
