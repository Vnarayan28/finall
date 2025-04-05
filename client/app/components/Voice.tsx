'use client'

import { useEffect, useState } from 'react'
import { RetellWebClient } from 'retell-client-js-sdk'

interface VoiceProps {
  onFuncCallResult?: (result: any) => void;
  onDataSocketConnect?: () => void;
  onUpdate?: (update: { transcript: MessageTranscript[] }) => void;
  funcCallSocket: WebSocket | undefined;
  retellClient: RetellWebClient | undefined;
  setFuncCallSocket: (funcCallSocket: WebSocket) => void;
  setRetellClient: (retellClient: RetellWebClient) => void;
}

export type MessageTranscript = {
  role: string;
  content: string;
}

export default function Voice(props: VoiceProps) {
  const [isCalling, setIsCalling] = useState(false);

  useEffect(() => {
    if (props.retellClient) return;

    const newRetellClient = new RetellWebClient();
    props.setRetellClient(newRetellClient);

    newRetellClient.on("conversationStarted", () => {
      console.log("Conversation started");
    });

    newRetellClient.on("conversationEnded", ({ code, reason }) => {
      console.log("Conversation ended:", code, reason);
      setIsCalling(false);
    });

    newRetellClient.on("update", (update) => {
      props.onUpdate?.(update);
    });

    return () => {
      newRetellClient.stopConversation();
    };
  }, [props.retellClient, props.setRetellClient, props.onUpdate]);

  const toggleConversation = async () => {
    if (!props.retellClient) return;

    if (isCalling) {
      props.retellClient.stopConversation();
    } else {
      const callId = await registerCall();
      if (callId) {
        props.retellClient.startConversation({
          callId,
          sampleRate: 16000,
          enableUpdate: true,
        });
        setIsCalling(true);
      }
    }
  };

  const registerCall = async (): Promise<string | undefined> => {
    try {
      const response = await fetch("http://localhost:8000/voice/register-call-on-your-server", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId: "094ec635562bfaa326741f43e55db95d" }),
      });

      const data = await response.json();
      if (data.callId) {
        connectFuncCallWebsocket(data.callId);
        return data.callId;
      }
    } catch (error) {
      console.error("Call registration failed:", error);
    }
  };

  const connectFuncCallWebsocket = (callId: string) => {
    const newFuncCallSocket = new WebSocket(`ws://localhost:8000/voice/data-websocket/${callId}`);
    props.setFuncCallSocket(newFuncCallSocket);

    newFuncCallSocket.onopen = () => {
      console.log("Function call websocket connected");
      props.onDataSocketConnect?.();
    };

    newFuncCallSocket.onmessage = (event) => {
      try {
        const result = JSON.parse(event.data);
        props.onFuncCallResult?.(result);
      } catch (error) {
        console.error("Error parsing function call result:", error);
      }
    };
  };

  return (
    <button
      onClick={toggleConversation}
      className="flex items-center bg-purple-500 hover:bg-purple-600 text-white rounded-full p-4"
    >
      {isCalling ? "Stop" : "Start"}
    </button>
  );
}