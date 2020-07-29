# TODO:

- Add PR workflow to publish canary version
  - `lerna "publish" "--canary" "--no-push" "--amend" "--preid" "testing"`
  - I don't think "amend" is necessary here anymore
  - Need to figure out the `preid`
  - Do we actually want to publish canary versions?
    - I think the PR should include the version bump in it, thus making canary unecessary
    - I think we can use `prerelease` with the commit hash as the preid or possible feature-{short hash}
- Add Master branch workflow that publishes actual version

# Typescript Lerna Boilerplate

This repo can be used as a template for creating packages that leverage Typescript and Lerna.

## Getting Started

Click **[HERE](https://github.com/colevoss/lerna-typescript-boilerplate/generate)** to create a repo under your
name or org in github. Then clone that repo, install dependencies, and start coding.

## Scripts

This boilerplate comes with the following scripts

### `create`

The create script will create a new package in the `packages` directory with the name provided. It copies
the `boilerplate` package and renames the `name` in the `package.json` with the name provided

```bash
npm run create -- <package-name>
```

### `test`

This will run all tests in the repo. It uses Jest's defaults for finding the tests.

```bash
npm test
```

### `build`

This will build all packages into their own `<package-name>/dist` directory.

```bash
npm run build
```

### `commit`

This uses [comitizen](https://github.com/commitizen/cz-cli) to help create awesome commit messages

```bash
npm run commit
```
