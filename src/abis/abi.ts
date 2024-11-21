// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const erc20Abi = [
  {
    constant: true,
    inputs: [],
    name: "name",
    outputs: [
      {
        name: "",
        type: "string",
      },
    ],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    constant: false,
    inputs: [
      {
        name: "_spender",
        type: "address",
      },
      {
        name: "_value",
        type: "uint256",
      },
    ],
    name: "approve",
    outputs: [
      {
        name: "",
        type: "bool",
      },
    ],
    payable: false,
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "totalSupply",
    outputs: [
      {
        name: "",
        type: "uint256",
      },
    ],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    constant: false,
    inputs: [
      {
        name: "_from",
        type: "address",
      },
      {
        name: "_to",
        type: "address",
      },
      {
        name: "_value",
        type: "uint256",
      },
    ],
    name: "transferFrom",
    outputs: [
      {
        name: "",
        type: "bool",
      },
    ],
    payable: false,
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "decimals",
    outputs: [
      {
        name: "",
        type: "uint8",
      },
    ],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    constant: true,
    inputs: [
      {
        name: "_owner",
        type: "address",
      },
    ],
    name: "balanceOf",
    outputs: [
      {
        name: "balance",
        type: "uint256",
      },
    ],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "symbol",
    outputs: [
      {
        name: "",
        type: "string",
      },
    ],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    constant: false,
    inputs: [
      {
        name: "_to",
        type: "address",
      },
      {
        name: "_value",
        type: "uint256",
      },
    ],
    name: "transfer",
    outputs: [
      {
        name: "",
        type: "bool",
      },
    ],
    payable: false,
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    constant: true,
    inputs: [
      {
        name: "_owner",
        type: "address",
      },
      {
        name: "_spender",
        type: "address",
      },
    ],
    name: "allowance",
    outputs: [
      {
        name: "",
        type: "uint256",
      },
    ],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    payable: true,
    stateMutability: "payable",
    type: "fallback",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        name: "owner",
        type: "address",
      },
      {
        indexed: true,
        name: "spender",
        type: "address",
      },
      {
        indexed: false,
        name: "value",
        type: "uint256",
      },
    ],
    name: "Approval",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        name: "from",
        type: "address",
      },
      {
        indexed: true,
        name: "to",
        type: "address",
      },
      {
        indexed: false,
        name: "value",
        type: "uint256",
      },
    ],
    name: "Transfer",
    type: "event",
  },
] as const;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const arrakisVaultAbi = [
  {
    inputs: [
      {
        internalType: "contract IUniswapV3Factory",
        name: "factory_",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "spender",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
    ],
    name: "Approval",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint8",
        name: "version",
        type: "uint8",
      },
    ],
    name: "Initialized",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "user",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "burnAmount0",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "burnAmount1",
        type: "uint256",
      },
    ],
    name: "LPBurned",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint24[]",
        name: "feeTiers",
        type: "uint24[]",
      },
    ],
    name: "LogAddPools",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address[]",
        name: "routers",
        type: "address[]",
      },
    ],
    name: "LogBlacklistRouters",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "receiver",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "burnAmount",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount0Out",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount1Out",
        type: "uint256",
      },
    ],
    name: "LogBurn",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "fee0",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "fee1",
        type: "uint256",
      },
    ],
    name: "LogCollectedFees",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "receiver",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "mintAmount",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount0In",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount1In",
        type: "uint256",
      },
    ],
    name: "LogMint",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        components: [
          {
            components: [
              {
                internalType: "uint128",
                name: "liquidity",
                type: "uint128",
              },
              {
                components: [
                  {
                    internalType: "int24",
                    name: "lowerTick",
                    type: "int24",
                  },
                  {
                    internalType: "int24",
                    name: "upperTick",
                    type: "int24",
                  },
                  {
                    internalType: "uint24",
                    name: "feeTier",
                    type: "uint24",
                  },
                ],
                internalType: "struct Range",
                name: "range",
                type: "tuple",
              },
            ],
            internalType: "struct PositionLiquidity[]",
            name: "burns",
            type: "tuple[]",
          },
          {
            components: [
              {
                internalType: "uint128",
                name: "liquidity",
                type: "uint128",
              },
              {
                components: [
                  {
                    internalType: "int24",
                    name: "lowerTick",
                    type: "int24",
                  },
                  {
                    internalType: "int24",
                    name: "upperTick",
                    type: "int24",
                  },
                  {
                    internalType: "uint24",
                    name: "feeTier",
                    type: "uint24",
                  },
                ],
                internalType: "struct Range",
                name: "range",
                type: "tuple",
              },
            ],
            internalType: "struct PositionLiquidity[]",
            name: "mints",
            type: "tuple[]",
          },
          {
            components: [
              {
                internalType: "bytes",
                name: "payload",
                type: "bytes",
              },
              {
                internalType: "address",
                name: "router",
                type: "address",
              },
              {
                internalType: "uint256",
                name: "amountIn",
                type: "uint256",
              },
              {
                internalType: "uint256",
                name: "expectedMinReturn",
                type: "uint256",
              },
              {
                internalType: "bool",
                name: "zeroForOne",
                type: "bool",
              },
            ],
            internalType: "struct SwapPayload",
            name: "swap",
            type: "tuple",
          },
          {
            internalType: "uint256",
            name: "minBurn0",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "minBurn1",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "minDeposit0",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "minDeposit1",
            type: "uint256",
          },
        ],
        indexed: false,
        internalType: "struct Rebalance",
        name: "rebalanceParams",
        type: "tuple",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "swapDelta0",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "swapDelta1",
        type: "uint256",
      },
    ],
    name: "LogRebalance",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address[]",
        name: "pools",
        type: "address[]",
      },
    ],
    name: "LogRemovePools",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "minter",
        type: "address",
      },
    ],
    name: "LogRestrictedMint",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "init0",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "init1",
        type: "uint256",
      },
    ],
    name: "LogSetInits",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "newManager",
        type: "address",
      },
    ],
    name: "LogSetManager",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint16",
        name: "managerFeeBPS",
        type: "uint16",
      },
    ],
    name: "LogSetManagerFeeBPS",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address[]",
        name: "routers",
        type: "address[]",
      },
    ],
    name: "LogWhitelistRouters",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "amount0",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount1",
        type: "uint256",
      },
    ],
    name: "LogWithdrawManagerBalance",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "previousOwner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "newOwner",
        type: "address",
      },
    ],
    name: "OwnershipTransferred",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "from",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
    ],
    name: "Transfer",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "uint24[]",
        name: "feeTiers_",
        type: "uint24[]",
      },
    ],
    name: "addPools",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        internalType: "address",
        name: "spender",
        type: "address",
      },
    ],
    name: "allowance",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "spender",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "approve",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "balanceOf",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address[]",
        name: "routers_",
        type: "address[]",
      },
    ],
    name: "blacklistRouters",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "burnAmount_",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "receiver_",
        type: "address",
      },
    ],
    name: "burn",
    outputs: [
      {
        internalType: "uint256",
        name: "amount0",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "amount1",
        type: "uint256",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [
      {
        internalType: "uint8",
        name: "",
        type: "uint8",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "spender",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "subtractedValue",
        type: "uint256",
      },
    ],
    name: "decreaseAllowance",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "factory",
    outputs: [
      {
        internalType: "contract IUniswapV3Factory",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getPools",
    outputs: [
      {
        internalType: "address[]",
        name: "",
        type: "address[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getRanges",
    outputs: [
      {
        components: [
          {
            internalType: "int24",
            name: "lowerTick",
            type: "int24",
          },
          {
            internalType: "int24",
            name: "upperTick",
            type: "int24",
          },
          {
            internalType: "uint24",
            name: "feeTier",
            type: "uint24",
          },
        ],
        internalType: "struct Range[]",
        name: "",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getRouters",
    outputs: [
      {
        internalType: "address[]",
        name: "",
        type: "address[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "spender",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "addedValue",
        type: "uint256",
      },
    ],
    name: "increaseAllowance",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "init0",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "init1",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "name_",
        type: "string",
      },
      {
        internalType: "string",
        name: "symbol_",
        type: "string",
      },
      {
        components: [
          {
            internalType: "uint24[]",
            name: "feeTiers",
            type: "uint24[]",
          },
          {
            internalType: "address",
            name: "token0",
            type: "address",
          },
          {
            internalType: "address",
            name: "token1",
            type: "address",
          },
          {
            internalType: "address",
            name: "owner",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "init0",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "init1",
            type: "uint256",
          },
          {
            internalType: "address",
            name: "manager",
            type: "address",
          },
          {
            internalType: "address[]",
            name: "routers",
            type: "address[]",
          },
        ],
        internalType: "struct InitializePayload",
        name: "params_",
        type: "tuple",
      },
    ],
    name: "initialize",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "manager",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "managerBalance0",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "managerBalance1",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "managerFeeBPS",
    outputs: [
      {
        internalType: "uint16",
        name: "",
        type: "uint16",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "mintAmount_",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "receiver_",
        type: "address",
      },
    ],
    name: "mint",
    outputs: [
      {
        internalType: "uint256",
        name: "amount0",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "amount1",
        type: "uint256",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "name",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          {
            components: [
              {
                internalType: "uint128",
                name: "liquidity",
                type: "uint128",
              },
              {
                components: [
                  {
                    internalType: "int24",
                    name: "lowerTick",
                    type: "int24",
                  },
                  {
                    internalType: "int24",
                    name: "upperTick",
                    type: "int24",
                  },
                  {
                    internalType: "uint24",
                    name: "feeTier",
                    type: "uint24",
                  },
                ],
                internalType: "struct Range",
                name: "range",
                type: "tuple",
              },
            ],
            internalType: "struct PositionLiquidity[]",
            name: "burns",
            type: "tuple[]",
          },
          {
            components: [
              {
                internalType: "uint128",
                name: "liquidity",
                type: "uint128",
              },
              {
                components: [
                  {
                    internalType: "int24",
                    name: "lowerTick",
                    type: "int24",
                  },
                  {
                    internalType: "int24",
                    name: "upperTick",
                    type: "int24",
                  },
                  {
                    internalType: "uint24",
                    name: "feeTier",
                    type: "uint24",
                  },
                ],
                internalType: "struct Range",
                name: "range",
                type: "tuple",
              },
            ],
            internalType: "struct PositionLiquidity[]",
            name: "mints",
            type: "tuple[]",
          },
          {
            components: [
              {
                internalType: "bytes",
                name: "payload",
                type: "bytes",
              },
              {
                internalType: "address",
                name: "router",
                type: "address",
              },
              {
                internalType: "uint256",
                name: "amountIn",
                type: "uint256",
              },
              {
                internalType: "uint256",
                name: "expectedMinReturn",
                type: "uint256",
              },
              {
                internalType: "bool",
                name: "zeroForOne",
                type: "bool",
              },
            ],
            internalType: "struct SwapPayload",
            name: "swap",
            type: "tuple",
          },
          {
            internalType: "uint256",
            name: "minBurn0",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "minBurn1",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "minDeposit0",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "minDeposit1",
            type: "uint256",
          },
        ],
        internalType: "struct Rebalance",
        name: "rebalanceParams_",
        type: "tuple",
      },
    ],
    name: "rebalance",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address[]",
        name: "pools_",
        type: "address[]",
      },
    ],
    name: "removePools",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "renounceOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "restrictedMint",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "init0_",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "init1_",
        type: "uint256",
      },
    ],
    name: "setInits",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "manager_",
        type: "address",
      },
    ],
    name: "setManager",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint16",
        name: "managerFeeBPS_",
        type: "uint16",
      },
    ],
    name: "setManagerFeeBPS",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "minter_",
        type: "address",
      },
    ],
    name: "setRestrictedMint",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "token0",
    outputs: [
      {
        internalType: "contract IERC20",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "token1",
    outputs: [
      {
        internalType: "contract IERC20",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalSupply",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "transfer",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "from",
        type: "address",
      },
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "transferFrom",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "newOwner",
        type: "address",
      },
    ],
    name: "transferOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "amount0Owed_",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "amount1Owed_",
        type: "uint256",
      },
      {
        internalType: "bytes",
        name: "",
        type: "bytes",
      },
    ],
    name: "uniswapV3MintCallback",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address[]",
        name: "routers_",
        type: "address[]",
      },
    ],
    name: "whitelistRouters",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "withdrawManagerBalance",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const arrakisHelperAbi = [
  {
    inputs: [
      {
        internalType: "contract IUniswapV3Factory",
        name: "factory_",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [],
    name: "factory",
    outputs: [
      {
        internalType: "contract IUniswapV3Factory",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: "int24",
            name: "lowerTick",
            type: "int24",
          },
          {
            internalType: "int24",
            name: "upperTick",
            type: "int24",
          },
          {
            internalType: "uint24",
            name: "feeTier",
            type: "uint24",
          },
        ],
        internalType: "struct Range[]",
        name: "ranges_",
        type: "tuple[]",
      },
      {
        internalType: "address",
        name: "token0_",
        type: "address",
      },
      {
        internalType: "address",
        name: "token1_",
        type: "address",
      },
      {
        internalType: "address",
        name: "vaultV2_",
        type: "address",
      },
    ],
    name: "token0AndToken1ByRange",
    outputs: [
      {
        components: [
          {
            components: [
              {
                internalType: "int24",
                name: "lowerTick",
                type: "int24",
              },
              {
                internalType: "int24",
                name: "upperTick",
                type: "int24",
              },
              {
                internalType: "uint24",
                name: "feeTier",
                type: "uint24",
              },
            ],
            internalType: "struct Range",
            name: "range",
            type: "tuple",
          },
          {
            internalType: "uint256",
            name: "amount",
            type: "uint256",
          },
        ],
        internalType: "struct Amount[]",
        name: "amount0s",
        type: "tuple[]",
      },
      {
        components: [
          {
            components: [
              {
                internalType: "int24",
                name: "lowerTick",
                type: "int24",
              },
              {
                internalType: "int24",
                name: "upperTick",
                type: "int24",
              },
              {
                internalType: "uint24",
                name: "feeTier",
                type: "uint24",
              },
            ],
            internalType: "struct Range",
            name: "range",
            type: "tuple",
          },
          {
            internalType: "uint256",
            name: "amount",
            type: "uint256",
          },
        ],
        internalType: "struct Amount[]",
        name: "amount1s",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: "int24",
            name: "lowerTick",
            type: "int24",
          },
          {
            internalType: "int24",
            name: "upperTick",
            type: "int24",
          },
          {
            internalType: "uint24",
            name: "feeTier",
            type: "uint24",
          },
        ],
        internalType: "struct Range[]",
        name: "ranges_",
        type: "tuple[]",
      },
      {
        internalType: "address",
        name: "token0_",
        type: "address",
      },
      {
        internalType: "address",
        name: "token1_",
        type: "address",
      },
      {
        internalType: "address",
        name: "vaultV2_",
        type: "address",
      },
    ],
    name: "token0AndToken1PlusFeesByRange",
    outputs: [
      {
        components: [
          {
            components: [
              {
                internalType: "int24",
                name: "lowerTick",
                type: "int24",
              },
              {
                internalType: "int24",
                name: "upperTick",
                type: "int24",
              },
              {
                internalType: "uint24",
                name: "feeTier",
                type: "uint24",
              },
            ],
            internalType: "struct Range",
            name: "range",
            type: "tuple",
          },
          {
            internalType: "uint256",
            name: "amount",
            type: "uint256",
          },
        ],
        internalType: "struct Amount[]",
        name: "amount0s",
        type: "tuple[]",
      },
      {
        components: [
          {
            components: [
              {
                internalType: "int24",
                name: "lowerTick",
                type: "int24",
              },
              {
                internalType: "int24",
                name: "upperTick",
                type: "int24",
              },
              {
                internalType: "uint24",
                name: "feeTier",
                type: "uint24",
              },
            ],
            internalType: "struct Range",
            name: "range",
            type: "tuple",
          },
          {
            internalType: "uint256",
            name: "amount",
            type: "uint256",
          },
        ],
        internalType: "struct Amount[]",
        name: "amount1s",
        type: "tuple[]",
      },
      {
        components: [
          {
            components: [
              {
                internalType: "int24",
                name: "lowerTick",
                type: "int24",
              },
              {
                internalType: "int24",
                name: "upperTick",
                type: "int24",
              },
              {
                internalType: "uint24",
                name: "feeTier",
                type: "uint24",
              },
            ],
            internalType: "struct Range",
            name: "range",
            type: "tuple",
          },
          {
            internalType: "uint256",
            name: "amount",
            type: "uint256",
          },
        ],
        internalType: "struct Amount[]",
        name: "fee0s",
        type: "tuple[]",
      },
      {
        components: [
          {
            components: [
              {
                internalType: "int24",
                name: "lowerTick",
                type: "int24",
              },
              {
                internalType: "int24",
                name: "upperTick",
                type: "int24",
              },
              {
                internalType: "uint24",
                name: "feeTier",
                type: "uint24",
              },
            ],
            internalType: "struct Range",
            name: "range",
            type: "tuple",
          },
          {
            internalType: "uint256",
            name: "amount",
            type: "uint256",
          },
        ],
        internalType: "struct Amount[]",
        name: "fee1s",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "contract IArrakisV2",
        name: "vault_",
        type: "address",
      },
    ],
    name: "totalLiquidity",
    outputs: [
      {
        components: [
          {
            internalType: "uint128",
            name: "liquidity",
            type: "uint128",
          },
          {
            components: [
              {
                internalType: "int24",
                name: "lowerTick",
                type: "int24",
              },
              {
                internalType: "int24",
                name: "upperTick",
                type: "int24",
              },
              {
                internalType: "uint24",
                name: "feeTier",
                type: "uint24",
              },
            ],
            internalType: "struct Range",
            name: "range",
            type: "tuple",
          },
        ],
        internalType: "struct PositionLiquidity[]",
        name: "liquidities",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "contract IArrakisV2",
        name: "vault_",
        type: "address",
      },
    ],
    name: "totalUnderlying",
    outputs: [
      {
        internalType: "uint256",
        name: "amount0",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "amount1",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "contract IArrakisV2",
        name: "vault_",
        type: "address",
      },
      {
        internalType: "uint160",
        name: "sqrtPriceX96_",
        type: "uint160",
      },
    ],
    name: "totalUnderlyingAtPrice",
    outputs: [
      {
        internalType: "uint256",
        name: "amount0",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "amount1",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "contract IArrakisV2",
        name: "vault_",
        type: "address",
      },
    ],
    name: "totalUnderlyingWithFees",
    outputs: [
      {
        internalType: "uint256",
        name: "amount0",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "amount1",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "fee0",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "fee1",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "contract IArrakisV2",
        name: "vault_",
        type: "address",
      },
    ],
    name: "totalUnderlyingWithFeesAndLeftOver",
    outputs: [
      {
        components: [
          {
            internalType: "uint256",
            name: "amount0",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "amount1",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "fee0",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "fee1",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "leftOver0",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "leftOver1",
            type: "uint256",
          },
        ],
        internalType: "struct UnderlyingOutput",
        name: "underlying",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const feeManagerAbi = [
  {
    inputs: [
      { internalType: "address", name: "vault_", type: "address" },
      { internalType: "address", name: "usdc_", type: "address" },
      { internalType: "address", name: "chaos_", type: "address" },
      { internalType: "address", name: "uniSwapRouter_", type: "address" },
      { internalType: "uint24", name: "feeTier_", type: "uint24" },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "previousOwner", type: "address" },
      { indexed: true, internalType: "address", name: "newOwner", type: "address" },
    ],
    name: "OwnershipTransferred",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "user", type: "address" },
      { indexed: false, internalType: "uint256", name: "usdcAmount", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "chaosAmount", type: "uint256" },
    ],
    name: "RewardsClaimed",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [{ indexed: false, internalType: "uint256", name: "usdcAmount", type: "uint256" }],
    name: "RewardsConvertedToUsdc",
    type: "event",
  },
  {
    inputs: [],
    name: "REWARDS_PRECISION",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "accumulatedRewardsPerShare",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "chaos",
    outputs: [{ internalType: "contract IERC20", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "claimer", type: "address" }],
    name: "claimFees",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "token0", type: "address" },
      { internalType: "uint256", name: "fees0", type: "uint256" },
      { internalType: "address", name: "token1", type: "address" },
      { internalType: "uint256", name: "fees1", type: "uint256" },
    ],
    name: "depositFees",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "feeTier",
    outputs: [{ internalType: "uint24", name: "", type: "uint24" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "rate",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  { inputs: [], name: "renounceOwnership", outputs: [], stateMutability: "nonpayable", type: "function" },
  {
    inputs: [{ internalType: "address", name: "", type: "address" }],
    name: "rewardDebt",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "router",
    outputs: [{ internalType: "contract ISwapRouter02", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "newRate", type: "uint256" }],
    name: "setRate",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "_user", type: "address" },
      { internalType: "uint256", name: "_amount", type: "uint256" },
    ],
    name: "setRewardDebt",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "newOwner", type: "address" }],
    name: "transferOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "usdc",
    outputs: [{ internalType: "contract IERC20", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "vault",
    outputs: [{ internalType: "contract IERC20", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  { inputs: [], name: "withdrawEmergency", outputs: [], stateMutability: "nonpayable", type: "function" },
  { inputs: [], name: "withdrawalChaos", outputs: [], stateMutability: "nonpayable", type: "function" },
] as const;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const arrakisResolverAbi = [
  {
    inputs: [{ internalType: "contract IUniswapV3Factory", name: "factory_", type: "address" }],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [],
    name: "factory",
    outputs: [{ internalType: "contract IUniswapV3Factory", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint160", name: "sqrtPriceX96_", type: "uint160" },
      { internalType: "int24", name: "lowerTick_", type: "int24" },
      { internalType: "int24", name: "upperTick_", type: "int24" },
      { internalType: "int128", name: "liquidity_", type: "int128" },
    ],
    name: "getAmountsForLiquidity",
    outputs: [
      { internalType: "uint256", name: "amount0", type: "uint256" },
      { internalType: "uint256", name: "amount1", type: "uint256" },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [
      { internalType: "contract IArrakisV2", name: "vaultV2_", type: "address" },
      { internalType: "uint256", name: "amount0Max_", type: "uint256" },
      { internalType: "uint256", name: "amount1Max_", type: "uint256" },
    ],
    name: "getMintAmounts",
    outputs: [
      { internalType: "uint256", name: "amount0", type: "uint256" },
      { internalType: "uint256", name: "amount1", type: "uint256" },
      { internalType: "uint256", name: "mintAmount", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "addr_", type: "address" },
      { internalType: "int24", name: "lowerTick_", type: "int24" },
      { internalType: "int24", name: "upperTick_", type: "int24" },
    ],
    name: "getPositionId",
    outputs: [{ internalType: "bytes32", name: "positionId", type: "bytes32" }],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          {
            components: [
              { internalType: "int24", name: "lowerTick", type: "int24" },
              { internalType: "int24", name: "upperTick", type: "int24" },
              { internalType: "uint24", name: "feeTier", type: "uint24" },
            ],
            internalType: "struct Range",
            name: "range",
            type: "tuple",
          },
          { internalType: "uint256", name: "weight", type: "uint256" },
        ],
        internalType: "struct RangeWeight[]",
        name: "rangeWeights_",
        type: "tuple[]",
      },
      { internalType: "contract IArrakisV2", name: "vaultV2_", type: "address" },
    ],
    name: "standardRebalance",
    outputs: [
      {
        components: [
          {
            components: [
              { internalType: "uint128", name: "liquidity", type: "uint128" },
              {
                components: [
                  { internalType: "int24", name: "lowerTick", type: "int24" },
                  { internalType: "int24", name: "upperTick", type: "int24" },
                  { internalType: "uint24", name: "feeTier", type: "uint24" },
                ],
                internalType: "struct Range",
                name: "range",
                type: "tuple",
              },
            ],
            internalType: "struct PositionLiquidity[]",
            name: "burns",
            type: "tuple[]",
          },
          {
            components: [
              { internalType: "uint128", name: "liquidity", type: "uint128" },
              {
                components: [
                  { internalType: "int24", name: "lowerTick", type: "int24" },
                  { internalType: "int24", name: "upperTick", type: "int24" },
                  { internalType: "uint24", name: "feeTier", type: "uint24" },
                ],
                internalType: "struct Range",
                name: "range",
                type: "tuple",
              },
            ],
            internalType: "struct PositionLiquidity[]",
            name: "mints",
            type: "tuple[]",
          },
          {
            components: [
              { internalType: "bytes", name: "payload", type: "bytes" },
              { internalType: "address", name: "router", type: "address" },
              { internalType: "uint256", name: "amountIn", type: "uint256" },
              { internalType: "uint256", name: "expectedMinReturn", type: "uint256" },
              { internalType: "bool", name: "zeroForOne", type: "bool" },
            ],
            internalType: "struct SwapPayload",
            name: "swap",
            type: "tuple",
          },
          { internalType: "uint256", name: "minBurn0", type: "uint256" },
          { internalType: "uint256", name: "minBurn1", type: "uint256" },
          { internalType: "uint256", name: "minDeposit0", type: "uint256" },
          { internalType: "uint256", name: "minDeposit1", type: "uint256" },
        ],
        internalType: "struct Rebalance",
        name: "rebalanceParams",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const mergeContractAbi = [
  {
    inputs: [
      { internalType: "address", name: "_wewe", type: "address" },
      { internalType: "address", name: "_token", type: "address" },
      { internalType: "uint32", name: "_vestingDuration", type: "uint32" },
      { internalType: "uint256", name: "_virtualToken", type: "uint256" },
      { internalType: "uint256", name: "_virtualWEWE", type: "uint256" },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [{ indexed: false, internalType: "uint256", name: "amount", type: "uint256" }],
    name: "Dumped",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: "uint256", name: "amount", type: "uint256" },
      { indexed: true, internalType: "address", name: "account", type: "address" },
      { indexed: false, internalType: "uint256", name: "weweAmount", type: "uint256" },
    ],
    name: "Merged",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "previousOwner", type: "address" },
      { indexed: true, internalType: "address", name: "newOwner", type: "address" },
    ],
    name: "OwnershipTransferred",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [{ indexed: false, internalType: "address", name: "account", type: "address" }],
    name: "Paused",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [{ indexed: false, internalType: "uint256", name: "newRate", type: "uint256" }],
    name: "RateChanged",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [{ indexed: false, internalType: "address", name: "account", type: "address" }],
    name: "Unpaused",
    type: "event",
  },
  {
    inputs: [],
    name: "adaptor",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "x", type: "uint256" }],
    name: "calculateTokensOut",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "account", type: "address" }],
    name: "canClaim",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  { inputs: [], name: "claim", outputs: [], stateMutability: "nonpayable", type: "function" },
  {
    inputs: [{ internalType: "uint256", name: "amount", type: "uint256" }],
    name: "deposit",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  { inputs: [], name: "dump", outputs: [], stateMutability: "nonpayable", type: "function" },
  {
    inputs: [],
    name: "getCurrentPrice",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getRate",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getToken",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "maxSupply",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "amount", type: "uint256" }],
    name: "merge",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "mergeAll",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "allocation", type: "uint256" },
      { internalType: "uint256", name: "amount", type: "uint256" },
      { internalType: "bytes32[]", name: "proof", type: "bytes32[]" },
    ],
    name: "mergeWithProof",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "merkleRoot",
    outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "name",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "paused",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "from", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
      { internalType: "address", name: "", type: "address" },
      { internalType: "bytes", name: "", type: "bytes" },
    ],
    name: "receiveApproval",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  { inputs: [], name: "renounceOwnership", outputs: [], stateMutability: "nonpayable", type: "function" },
  {
    inputs: [{ internalType: "address", name: "amm", type: "address" }],
    name: "setAdaptor",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "value", type: "uint256" }],
    name: "setMaxSupply",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes32", name: "root", type: "bytes32" }],
    name: "setMerkleRoot",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "_treasury", type: "address" }],
    name: "setTreasury",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint32", name: "duration", type: "uint32" }],
    name: "setVestingDuration",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "value", type: "uint256" }],
    name: "setVirtualTokenBalance",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "value", type: "uint256" }],
    name: "setVirtualWeWEBalance",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  { inputs: [], name: "sweep", outputs: [], stateMutability: "nonpayable", type: "function" },
  { inputs: [], name: "togglePause", outputs: [], stateMutability: "nonpayable", type: "function" },
  {
    inputs: [],
    name: "totalMerged",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalVested",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "newOwner", type: "address" }],
    name: "transferOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "treasury",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "vestingDuration",
    outputs: [{ internalType: "uint32", name: "", type: "uint32" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "", type: "address" }],
    name: "vestings",
    outputs: [
      { internalType: "uint256", name: "amount", type: "uint256" },
      { internalType: "uint256", name: "end", type: "uint256" },
      { internalType: "uint256", name: "merged", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "virtualToken",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "virtualWEWE",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "wewe",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
] as const;
