import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../utils/api';
import { toast } from '../../store/toastStore';
import VenueForm from '../../components/VenueForm';
import Spinner from '../../components/Spinner';
import { buildVenueFormData, buildVenueJson } from '../../utils/venuePayload';

// ---------------------------------------------------------------------------
//  OwnerVenueForm — VenueForm ustidan ingichka wrapper.
//   create -> POST /owner/venues (multipart),  edit -> PUT /owner/venues/:id (JSON)
// ---------------------------------------------------------------------------
export default function OwnerVenueForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [initial, setInitial] = useState(null);
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    api
      .get(`/venues/${id}`)
      .then((res) => setInitial(res.data.venue))
      .catch((err) => toast.error(err.response?.data?.message || 'To\'yxona topilmadi'))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const handleSubmit = async (data) => {
    setSubmitting(true);
    try {
      if (isEdit) {
        await api.put(`/owner/venues/${id}`, buildVenueJson(data));
        toast.success('To\'yxona yangilandi');
      } else {
        await api.post('/owner/venues', buildVenueFormData(data));
        toast.success('To\'yxona qo\'shildi (admin tasdiqlashini kutadi)');
      }
      navigate('/owner');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Saqlashda xatolik');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="venue-form">
      <div className="page-head">
        <h1>{isEdit ? 'To\'yxonani tahrirlash' : 'Yangi to\'yxona'}</h1>
        <Link to="/owner" className="btn btn-ghost btn-sm">← Orqaga</Link>
      </div>

      {isEdit && initial && initial.status !== 'tasdiqlangan' && (
        <p className="error" style={{ background: '#fffbeb', borderColor: '#fde68a', color: '#92400e' }}>
          Status: <b>{initial.status}</b> — admin tasdiqlamaguncha shunday qoladi.
        </p>
      )}

      <VenueForm
        isEdit={isEdit}
        initial={initial}
        submitting={submitting}
        submitLabel={isEdit ? 'Saqlash' : 'Qo\'shish'}
        onValidSubmit={handleSubmit}
      />
    </div>
  );
}
