import { BrowserRouter, Routes, Route } from 'react-router-dom';
import CrearEleccion from '@/pages/eleccion/CrearEleccion';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/elecciones/crear" element={<CrearEleccion />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;