# DEUS V3 Core Contracts

Our V3 contracts are written using the [EIP-2535](https://eips.ethereum.org/EIPS/eip-2535) "Diamond" Standard, please read the documentation before interacting with them. Our Diamond contract is deployed [here](https://louper.dev/diamond/0xF78B5C36b37CF03fB30E1C5fE0eD75002B93a466?network=abritrum).

### Usage

Before being able to run any command, you need to create a `.env` file. You can follow the example in `.env.example`.

Then, proceed with installing dependencies:

```sh
$ yarn install
```

### Compile

Compile the smart contracts with Hardhat:

```sh
$ yarn compile
```

### TypeChain

Compile the smart contracts and generate TypeChain bindings:

```sh
$ yarn typechain
```

### Test

Run the tests with Hardhat:

```sh
$ yarn test
```

### Coverage

Generate the code coverage report:

```sh
$ yarn coverage
```

### Clean

Delete the smart contract artifacts, the coverage reports and the Hardhat cache:

```sh
$ yarn clean
```

### Deploy

Deploy the contracts to Hardhat Network:

```sh
$ yarn deploy
```
