#!/usr/bin/env bash

# Make sure tests pass before publishing
npm test

# Build documentation and commit to the gh-pages branch, then go back to master branch
docco lib/redis-manager.js
git stash
git checkout gh-pages
mv docs/* .
rmdir docs
rm index.html
mv redis-manager.html index.html
git commit -am "Automatic documentation for version $npm_package_version"
git checkout master
git stash pop

# Create the commit, tag the commit with the proper version, and push to GitHub
git commit -am "Automatic commit of version $npm_package_version"
git tag $npm_package_version
git push
git push --tags

# Publish to NPM
npm publish
