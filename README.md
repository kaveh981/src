# Project Atwater

# Setup
In order to run Atwater, you will need to follow the instructions found on our [Setup](http://confluence.indexexchange.com/display/ATW/Setup) page and its sub-pages.
They detail how to setup our repository on your local machine and how to set up a running version of our API on your docker virtual machine.

# Release Notes
## Release 0.1.0
### New Routes
- `/deals GET`
- `/deals/active PUT`

### Functionality
- List all available deals for purchase by sending a `GET` request to `/deals`
- Accept a deal that's available for purchase by sending a `PUT` request with the desired `packageID` to `/deals/active`