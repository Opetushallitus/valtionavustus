type FeatureFlag = { "enabled?": boolean };

export interface EnvironmentApiResponse {
  name: string;
  "show-name": boolean;
  "hakija-server": {
    url: {
      fi: string;
      sv: string;
    };
  };
  notice: {
    fi: string;
    sv: string;
  };
  "multibatch-payments": FeatureFlag;
  "dont-send-loppuselvityspyynto-to-virkailija"?: FeatureFlag;
  "ta-tilit"?: FeatureFlag;
  payments: FeatureFlag & { "delete-payments?": boolean };
}

type FeatureFlags<T> = {
  [P in keyof T as T[P] extends FeatureFlag ? P : never]: T[P];
};

export type FeatureFlagKey = keyof FeatureFlags<
  Required<EnvironmentApiResponse>
>;
