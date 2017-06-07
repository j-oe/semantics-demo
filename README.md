# fastclass - Demo for SEMANTiCS 2017
This repository contains the prototypical implementation of the ideas presented in the submitted paper: _Semantic Annotation of Heterogeneous Data Sources: Towards an Integrated Information Framework for Service Technicians_.

It covers the code for the automated classification and modularization of technical documentation. The demo provides a web interface for the training of models from data (XML, JSON, FCM), the classification of content components (XML, JSON) and the segmentation of unstructured documents (PDF). Alternatively demo data can be loaded into the application.

The implementation is based on previous work available at:
http://janoevermann.de

## Hosted demo
A hosted demo is available at:
http://semantics.fastclass.de

## Run demo locally
To run a local version of the demo:
1. clone the repository
2. build from source (see below)
3. start a web server in the `dist` folder
4. navigate your browser to the location

## Build from source
To build the demo from source you need to have the following tools globally installed:
- *npm* (https://nodejs.org/en/download/)

Execute the following steps to set up the development environment (directory `src`). A build will be automatically initiated
- `npm install`

To generate a new build from source (directory `dist`):
- `gulp build`
