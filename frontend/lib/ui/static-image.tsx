import React, { DetailedHTMLProps, ImgHTMLAttributes } from "react";
import { AppContext } from "../app-context";
import { BulmaImageClass } from "./bulma";

type ImgProps = DetailedHTMLProps<
  ImgHTMLAttributes<HTMLImageElement>,
  HTMLImageElement
>;

export type StaticImageProps = ImgProps & {
  src: string;
  alt: string;
  ratio?: BulmaImageClass;
};

export function StaticImage(props: StaticImageProps): JSX.Element {
  const { ratio, ...imgProps } = props;
  return (
    <AppContext.Consumer>
      {(appCtx) => (
        <figure className={"image " + (props.ratio || "")}>
          <img {...imgProps} src={`${appCtx.server.staticURL}${props.src}`} />
        </figure>
      )}
    </AppContext.Consumer>
  );
}
