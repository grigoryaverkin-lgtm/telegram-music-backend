import { useEffect, useState } from "react"
import WebApp from "@twa-dev/sdk"

function App() {

  const [tracks,setTracks] = useState([])
  const [current,setCurrent] = useState(null)

  useEffect(()=>{

    WebApp.ready()
    WebApp.expand()

    fetch("http://localhost:3000/tracks")
      .then(res=>res.json())
      .then(data=>setTracks(data))

  },[])

  return (

    <div style={{padding:20,fontFamily:"sans-serif"}}>

      <h2>🎧 Telegram Music</h2>

      {tracks.map(track=>(
        <div
          key={track.id}
          onClick={()=>setCurrent(track)}
          style={{
            padding:10,
            borderBottom:"1px solid #ccc",
            cursor:"pointer"
          }}
        >

          <b>{track.title}</b>
          <div>{track.artist}</div>

        </div>
      ))}

      {current && (

        <div style={{marginTop:20}}>

          <h3>{current.title}</h3>

          <audio
            src={current.url}
            controls
            autoPlay
            style={{width:"100%"}}
          />

        </div>

      )}

    </div>

  )

}

export default App