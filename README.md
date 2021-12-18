# react-json-form

React Component for editing JSON data using form inputs.

# Developing

 1. Clone the repo.
 2. Run `npm install` to install packages required for development.
 3. Run `npm run dev`. This will start a script which will automatically compile
    js files upon changes.
 4. Open a new terminal and:
    1. Go into `dev/` directory: `cd dev`.
    2. Run `python3 -m http.server` This will start a server at `localhost:8888`.


There's a `dev/index.html` file which will be served by the Python server.
This is used for rendering and developing the library.

Currently, there's no hot-reloading set up, so when you make changes you'll 
have to reload the page manually to view changes.

For building production packages, run: `npm run build`.