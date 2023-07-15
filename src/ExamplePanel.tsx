import { Immutable, MessageEvent, PanelExtensionContext, Topic } from "@foxglove/studio";
import { useEffect, useLayoutEffect, useState, useRef } from "react";
import ReactDOM from "react-dom";
import { Plot, Point } from './plotter';

function ExamplePanel({ context }: { context: PanelExtensionContext }): JSX.Element {
  const [topics, setTopics] = useState<undefined | Immutable<Topic[]>>();
  const [messages, setMessages] = useState<undefined | Immutable<MessageEvent[]>>();

  const [renderDone, setRenderDone] = useState<(() => void) | undefined>();
  const [plot, setPlot] = useState<Plot | undefined>();

  const divRef = useRef<HTMLDivElement>(null);
  const plotRef = useRef<HTMLDivElement>(null);

  // We use a layout effect to setup render handling for our panel. We also setup some topic subscriptions.
  useLayoutEffect(() => {

    // The render handler is run by the broader studio system during playback when your panel
    // needs to render because the fields it is watching have changed. How you handle rendering depends on your framework.
    // You can only setup one render handler - usually early on in setting up your panel.
    //
    // Without a render handler your panel will never receive updates.
    //
    // The render handler could be invoked as often as 60hz during playback if fields are changing often.
    context.onRender = (renderState, done) => {
      console.log(plot);
      console.log(plotRef);
      if (plot === undefined && plotRef.current !== null) {
      console.log("Creating plot panel");
      const newPlot = new Plot(plotRef.current);
    newPlot.getAxisLabels().setTitle("hello!");
    const line = newPlot.getDrawer().addLine();
    line.setLabel("ONE");
    const points = [];
    const NUM_POINTS = 2e6;
    for (let ii = 0; ii < NUM_POINTS; ++ii) {
      points.push(new Point(ii, Math.sin(ii * 10 / NUM_POINTS)));
    }
    line.setPoints(points);
    setPlot(newPlot);
    }
      // render functions receive a _done_ callback. You MUST call this callback to indicate your panel has finished rendering.
      // Your panel will not receive another render callback until _done_ is called from a prior render. If your panel is not done
      // rendering before the next render call, studio shows a notification to the user that your panel is delayed.
      //
      // Set the done callback into a state variable to trigger a re-render.
      setRenderDone(() => done);

      // We may have new topics - since we are also watching for messages in the current frame, topics may not have changed
      // It is up to you to determine the correct action when state has not changed.
      setTopics(renderState.topics);

      // currentFrame has messages on subscribed topics since the last render call
      setMessages(renderState.currentFrame);

      console.log(divRef);
      if (divRef.current !== null) {
        console.log(divRef.current);
        console.log(divRef.current['innerHTML']);
        divRef.current.innerHTML += 'a';
      }
    };

    // After adding a render handler, you must indicate which fields from RenderState will trigger updates.
    // If you do not watch any fields then your panel will never render since the panel context will assume you do not want any updates.

    // tell the panel context that we care about any update to the _topic_ field of RenderState
    context.watch("topics");

    // tell the panel context we want messages for the current frame for topics we've subscribed to
    // This corresponds to the _currentFrame_ field of render state.
    context.watch("currentFrame");

    // subscribe to some topics, you could do this within other effects, based on input fields, etc
    // Once you subscribe to topics, currentFrame will contain message events from those topics (assuming there are messages).
    context.subscribe([{ topic: "/some/topic" }]);
  }, [context]);

  // invoke the done callback once the render is complete
  useEffect(() => {
    renderDone?.();
  }, [renderDone]);

  return (
    <div style={{ padding: "1rem", display: "block", height: "100%" }}>
      <div ref={plotRef} style={{ width: "100%", height: "100%", position: "relative", display: "inline-block" }}></div>
    </div>
  );
}

export function initExamplePanel(context: PanelExtensionContext): () => void {
  ReactDOM.render(<ExamplePanel context={context} />, context.panelElement);

  // Return a function to run when the panel is removed
  return () => {
    ReactDOM.unmountComponentAtNode(context.panelElement);
  };
}
