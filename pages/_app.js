import { Analytics } from "@vercel/analytics/react"
import { ThemeProvider } from "next-themes"
import { Toaster } from "react-hot-toast"
import "../styles/globals.css"

function MyApp({ Component, pageProps }) {
  return (
    <>
      <ThemeProvider
        attribute="class"
        enableSystem={true}
        defaultTheme="system"
      >
        <Component {...pageProps} />
        <Toaster position="bottom-center" />
      </ThemeProvider>
      <Analytics />
    </>
  )
}

export default MyApp;
