import * as React from "react";
import * as ReactDOM from "react-dom";

export interface HelloWorldProps {
  userName: string;
  lang: string;
}

export function App(props: HelloWorldProps) {
  return (
  <h2>
    Hi {props.userName} from React! Welcome to {props.lang}!
  </h2>
  );
}

ReactDOM.render(
  <App userName="Beveloper" lang="TypeScript" />,
  document.getElementById("app")
  );
