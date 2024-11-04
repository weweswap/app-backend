export interface KyberSwapResponse {
  code: number;
  message: string;
  data: KyberSwapData;
  requestId: string;
}

export interface KyberSwapData {
  routeSummary: RouteSummary;
  routerAddress: string;
}

export interface RouteSummary {
  tokenIn: string;
  amountIn: string;
  amountInUsd: string;
  tokenInMarketPriceAvailable: boolean;
  tokenOut: string;
  amountOut: string;
  amountOutUsd: string;
  tokenOutMarketPriceAvailable: boolean;
  gas: string;
  gasPrice: string;
  gasUsd: string;
  extraFee: ExtraFee;
  route: RouteStep[][];
}

export interface ExtraFee {
  feeAmount: string;
  chargeFeeBy: string;
  isInBps: boolean;
  feeReceiver: string;
}

export interface RouteStep {
  pool: string;
  tokenIn: string;
  tokenOut: string;
  limitReturnAmount: string;
  swapAmount: string;
  amountOut: string;
  exchange: string;
  poolLength: number;
  poolType: string;
  poolExtra: PoolExtra | null;
  extra: Record<string, any>;
}

export interface PoolExtra {
  blockNumber: number;
}
