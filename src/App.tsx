import { useState } from 'react'
import reactLogo from './assets/react.svg'

import './App.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

function App() {
  const [count, setCount] = useState(0)

  return (
    <>

    </>
  )
}

export default App
