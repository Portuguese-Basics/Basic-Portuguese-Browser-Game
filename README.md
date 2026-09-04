# Basic Portuguese Browser Game

It all started with a dot that was an archer. The project is now a buildless,
single-page settlement and colony simulation with a Brazilian Portuguese
interface and deliberately minimal canvas graphics.

Play the public version:
https://portuguese-basics.github.io/Basic-Portuguese-Browser-Game/

Development remains centered on `index.html`. Run the complete regression suite
before publishing:

```sh
node verification/smoke-test.js
```

GitHub `main` is canonical. The existing Google Drive ZIP is updated in place
only after the GitHub Pages release has been verified. Existing browser and
transferred saves must remain compatible.
