import { Component, type PropsWithChildren, type ReactNode } from "react";

type Props = PropsWithChildren<{
  fallback?: ReactNode;
  onError?: () => void;
}>;

export default class SceneErrorBoundary extends Component<Props> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch() {
    this.props.onError?.();
  }

  render() {
    return this.state.failed ? this.props.fallback ?? null : this.props.children;
  }
}
