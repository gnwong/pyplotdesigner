from pathlib import Path

from setuptools import setup, find_packages


README = Path(__file__).parent / "README.md"

setup(
    name='pyplotdesigner',
    version='0.5.1',
    packages=find_packages(include=['pyplotdesigner', 'pyplotdesigner.*']),
    include_package_data=True,
    package_data={
        'pyplotdesigner.gui': ['webapp/*'],
    },
    install_requires=[
        'numpy',
        'matplotlib',
        'fastapi',
        'uvicorn',
    ],
    description="A set of tools to help format matplotlib figures",
    long_description=README.read_text(encoding="utf-8"),
    long_description_content_type="text/markdown",
    author='gnwong',
    author_email='gnwong@ias.edu',
    url="https://github.com/gnwong/pyplotdesigner",
    classifiers=[
        "Programming Language :: Python :: 3",
        "License :: OSI Approved :: MIT License",
        "Intended Audience :: Science/Research",
    ],
)
