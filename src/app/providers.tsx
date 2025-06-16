"use client";
import 'react-calendar/dist/Calendar.css';
import { SessionProvider } from "next-auth/react";
import { NextUIProvider } from "@nextui-org/react";
import { AppProgressBar as ProgressBar } from 'next-nprogress-bar';
type Props = {
  children?: React.ReactNode;
};

export const NextAuthProvider = ({ children }: Props) => {
  return (
    <SessionProvider>
      <NextUIProvider>
        {children}
        <ProgressBar
          height="4px"
          color="#FF6600"
          options={{ showSpinner: false }}
          shallowRouting
        />
      </NextUIProvider>
    </SessionProvider>
  )
};
