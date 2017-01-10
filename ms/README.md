## How to run

Please run `python -m SimpleHTTPServer` from this folder.
Now visit `http://localhost:8000`.

## Note

The bars in histogram and dots in scatterplot are both clickable to open a new tab.
But the url is not opening due to how the application at prez.dialedin.io handles it.
If you change the "98" in the `urlPrefix` in `main.js` to say, "981" then the url opens 
with 404, thereby confirming that logic from the charts are working.
