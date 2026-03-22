import { CheckCircle, XCircle, Info } from 'lucide-react';
const icons = { success:<CheckCircle size={15}/>, error:<XCircle size={15}/>, info:<Info size={15}/> };
export function ToastContainer({ toasts }) {
  if (!toasts.length) return null;
  return (
    <div className="toast-container">
      {toasts.map(t=>(
        <div key={t.id} className={`toast toast-${t.type}`}>
          {icons[t.type]}{t.message}
        </div>
      ))}
    </div>
  );
}
