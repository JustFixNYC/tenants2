import React, { DetailedHTMLProps, ImgHTMLAttributes } from "react";
import { AppContext } from "../../app-context";

type ImgProps = DetailedHTMLProps<
  ImgHTMLAttributes<HTMLImageElement>,
  HTMLImageElement
>;

export type StaticImageProps = ImgProps & {
  src: string;
  alt: string;
};

export function BackgroundImage(props: StaticImageProps): JSX.Element {
  const { ...imgProps } = props;
  return (
    <AppContext.Consumer>
      {(appCtx) => (
        <figure className="image jf-background-image">
          <img {...imgProps} src={`${appCtx.server.staticURL}${props.src}`} />
        </figure>
      )}
    </AppContext.Consumer>
  );
}
