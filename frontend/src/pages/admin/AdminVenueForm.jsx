import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../utils/api';
import { toast } from '../../store/toastStore';
import VenueForm from '../../components/VenueForm';
import Spinner from '../../components/Spinner';
import { buildVenueFormData, buildVenueJson } from '../../utils/venuePayload';

// ---------------------------------------------------------------------------
//  AdminVenueForm — VenueForm ustidan wrapper (admin).
//   create -> POST /venues (multipart; admin -> status='tasdiqlangan')
//   edit   -> PUT /admin/venues/:id (JSON, xizmatlar bilan)
// ---------------------------------------------------------------------------
export default function AdminVenueForm() {
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
        await api.put(`/admin/venues/${id}`, buildVenueJson(data));
        toast.success('To\'yxona yangilandi');
      } else {
        await api.post('/venues', buildVenueFormData(data));
        toast.success('To\'yxona qo\'shildi');
      }
      navigate('/admin');
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
        <Link to="/admin" className="btn btn-ghost btn-sm">← Orqaga</Link>
      </div>

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
