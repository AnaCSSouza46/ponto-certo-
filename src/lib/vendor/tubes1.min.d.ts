declare const TubesCursor: (
  canvas: HTMLCanvasElement,
  options: Record<string, unknown>,
) => { dispose?: () => void } | void;

export default TubesCursor;