# react-json-form

React Component for editing JSON data using form inputs.

# Developing

 1. Clone the repo.
 2. Run `npm install` to install packages required for development.
 3. The source files are in `src/` directory. These are the files you need to change.
 4. Run `npm run dev`. This will start a script which will automatically compile
    js files upon changes.

**To view your changes**, use the `dev/index.html` file. This is used for rendering
the library while developing it.

 1. Open a new terminal
 2. Go into `dev/` directory: `cd dev`.
 3. Run `python3 -m http.server` This will start a server at `localhost:8000`
 which will serve the `dev/index.html` file.
 4. Open `localhost:8000` in your browser and you're set for testing.

Currently, there's no hot-reloading set up, so when you make changes you'll 
have to reload the page manually to view changes.

For building production packages, run: `npm run build`.