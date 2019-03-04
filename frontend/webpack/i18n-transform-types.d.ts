export type I18nTransformOptions = {
  uppercase?: boolean,
  func?: boolean
};

export type I18nTransformState = {
  opts: I18nTransformOptions
  file: {
    opts: {
      filename: string
    }
  }
};
