# Project Atwater

# Setup
In order to run Atwater, you will need to follow the instructions in our [Setup Guide](http://confluence.indexexchange.com/display/ATW/Setup) and its sub-pages.
They detail how to setup our repository on your local machine and how to set up a running version of our API on your docker virtual machine.

# Structure
Atwater's project structure is currently divided into the following components:
- `api/`
    - contains source code, configuration, unit tests, and any other files that are only related to API functionality
- `docs/`
    - contains any project documentation, which is mainly API specifications at this point
- `nginx/`
    - contains configuration files for the NGINX instance
- `test/`
  - contains all end-to-end tests and test suites for the project

# Release Notes
## Release 0.1.0
### New Routes
- `/deals GET`
- `/deals/active PUT`

### Functionality
- List all available deals for purchase by sending a `GET` request to `/deals`
- Accept a deal that's available for purchase by sending a `PUT` request with the desired `packageID` to `/deals/active`