import './Modal.css'

export default function Modal({ children, onClose }) {
  return (
    <div className="compt-modal-overlay compt-modal-overlay--show" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="compt-modal-card">
        {children}
      </div>
    </div>
  )
}
