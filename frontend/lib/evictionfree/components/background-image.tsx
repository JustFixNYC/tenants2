import React, { DetailedHTMLProps, ImgHTMLAttributes, useContext } from "react";
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
  const appCtx = useContext(AppContext);
  return (
    <figure className="image jf-background-image">
      <img {...imgProps} src={`${appCtx.server.staticURL}${props.src}`} />
    </figure>
  );
}
