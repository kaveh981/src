# Project Atwater
Project Atwater is an API that allows buyers (advertisers, trading desks, DSPs) to purchase and negotiate deals with publishers.

# Setup
In order to run Atwater, you will need to follow the instructions in our [Setup Guide](http://confluence.indexexchange.com/display/ATW/Setup) and its sub-pages.
They detail how to setup our repository on your local machine and how to set up a running version of our API on your docker virtual machine.

# Structure
Atwater's project structure is currently divided into the following components:
- `api/`
    - contains source code, configuration, unit tests, spec, and any other files that are only related to API functionality
- `nginx/`
    - contains configuration files for the NGINX instance
- `test/`
    - contains all end-to-end tests and test suites for the project
- `utils/`
    - contains utilities that can be used for importing IXM-related data into IX databases

# Useful Links
- [Confluence Space](http://confluence.indexexchange.com/display/ATW/Overview)

# Release Notes
## Release 0.3.0
- Sections are now negotiable
- `.env` file is no longer used
- SH auth is now supported
- Support has been added for user/company impersonation and representation
- API validation is now done directly from the spec
- CSV section import has been added
- IXM user creation is now supported
- Notifications are now supported
- A whole new set of bugs, as requested by our community
- ...and much, much more.

<br>
<sup>"So, yesterday, I worked on the button. Today, I'm gonna work on the button." - Alessandro Parisi, Atwater Button Specialist, 2017</sup>  
<sup>All rights reserved. ®</sup>

## Release 0.2.0
- Added several new routes (see below for details)
- Added publisher support to all routes. Routes are now accessible by both publishers and buyers.
- Routes now return more detailed information (elements such as sections, user information, and proposal references are returned as full objects, not just ID's)
- CSV import utils have been added
- Validator is now stricter
- Pagination is now more user-friendly
- API specification has been greatly expanded

### Features
- List all proposals available for purchase by sending a `GET` request to `/deals/proposals`
- View a specific proposal by sending a `GET` request to `/deals/proposals/{proposal_id}`
- Send a counter-offer to a proposal (or another offer) by sending a `PUT` request to `/deals/negotiations`
- List all negotiations by sending a `GET` request to `/deals/negotiations`
- View proposal-specific negotiations by sending a `GET` request to `/{proposal_id}`
- View a specific negotiation by sending a `GET` request to `/{proposal_id}/{partner_id}`
- List all active deals by sending a `GET` request to `/deals/active`
- Import proposals into IX database by using a CSV import tool

<br>
<sup>"We need to crush it, not rush it." - Eusebio Olalde, 2016</sup>  
<sup>All rights reserved. ®</sup>

## Release 0.1.0
- API framework has been set up
    - Models structure was defined
    - Dependency injector was created
    - RAML Validator was created
    - File logger was created
    - Error handling middleware was created
    - Basic buyer authentication was created
- Testing framework has been set up
    - Database populator was created
    - Helper and setup functions were added
- Docker has been configured
    - Works on local machine
    - Works on virtual machine
- NGINX has been configured

### Features
- List all available deals for purchase by sending a `GET` request to `/deals`
- Accept a deal that's available for purchase by sending a `PUT` request with the desired `packageID` to `/deals/active`

<br>
<sup>"This is the buyer API. Hot stuff." - Adam Harvie, 2016</sup>  
<sup>All rights reserved. ®</sup>

