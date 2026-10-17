import React, { useState } from 'react';
import { ContactFormData } from '../types';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ContactModal: React.FC<ContactModalProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState<ContactFormData>({
    fullName: '',
    email: '',
    phone: '',
    subject: 'Renseignement général',
    message: '',
  });

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  // Validation logic
  const validateField = (name: keyof ContactFormData, value: string) => {
    let err = '';
    if (name === 'fullName') {
      if (!value.trim()) {
        err = 'Le nom complet est obligatoire.';
      } else if (value.trim().length < 2) {
        err = 'Veuillez saisir au moins 2 caractères.';
      }
    } else if (name === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!value.trim()) {
        err = "L'adresse email est obligatoire.";
      } else if (!emailRegex.test(value.trim())) {
        err = 'Veuillez entrer une adresse email valide.';
      }
    } else if (name === 'message') {
      if (!value.trim()) {
        err = 'Le message ne peut pas être vide.';
      } else if (value.trim().length < 15) {
        err = `Encore au moins ${15 - value.trim().length} caractères requis.`;
      }
    }
    return err;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (touched[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: validateField(name as keyof ContactFormData, value),
      }));
    }
  };

  const handleBlur = (
    e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    setErrors((prev) => ({
      ...prev,
      [name]: validateField(name as keyof ContactFormData, value),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const nameErr = validateField('fullName', formData.fullName);
    const emailErr = validateField('email', formData.email);
    const msgErr = validateField('message', formData.message);

    const newErrors = {
      fullName: nameErr,
      email: emailErr,
      message: msgErr,
    };

    setErrors(newErrors);
    setTouched({ fullName: true, email: true, message: true });

    if (!nameErr && !emailErr && !msgErr) {
      setIsSubmitting(true);
      setTimeout(() => {
        setIsSubmitting(false);
        setIsSuccess(true);
      }, 700);
    }
  };

  const handleResetAndClose = () => {
    setFormData({
      fullName: '',
      email: '',
      phone: '',
      subject: 'Renseignement général',
      message: '',
    });
    setTouched({});
    setErrors({});
    setIsSuccess(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-sand-card rounded-2xl shadow-2xl border hairline-border w-full max-w-lg overflow-hidden my-8 animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-5 bg-[#FAF9F6] border-b hairline-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand/10 border border-brand/15 flex items-center justify-center text-brand">
              <span className="material-symbols-outlined text-[22px]">contact_support</span>
            </div>
            <div>
              <span className="font-display text-[10px] uppercase tracking-[0.14em] text-ink-muted font-bold block">
                Support & Contact
              </span>
              <h3 className="font-display text-lg font-bold text-ink">Échanger avec l'équipe GRPD</h3>
            </div>
          </div>
          <button
            onClick={handleResetAndClose}
            className="w-8 h-8 rounded-full hover:bg-sand-muted flex items-center justify-center text-ink-muted hover:text-ink transition-colors cursor-pointer"
            aria-label="Fermer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {isSuccess ? (
            <div className="text-center py-6 space-y-4 animate-in fade-in duration-300">
              <div className="w-16 h-16 rounded-full bg-brand/10 text-brand border border-brand/15 flex items-center justify-center mx-auto">
                <span
                  className="material-symbols-outlined text-[36px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  check_circle
                </span>
              </div>
              <div>
                <h4 className="font-display text-xl font-bold text-ink">Message envoyé avec succès !</h4>
                <p className="font-sans text-sm text-ink-muted mt-1 max-w-sm mx-auto">
                  Merci <strong>{formData.fullName}</strong>. Notre équipe d'animation à Casablanca vous répondra sous 24h à l'adresse <em>{formData.email}</em>.
                </p>
              </div>

              <div className="bg-[#FAF9F6] rounded-xl p-3.5 text-left text-xs space-y-1 max-w-sm mx-auto border hairline-border">
                <span className="font-display font-bold text-brand block uppercase tracking-wider text-[11px]">
                  Objet : {formData.subject}
                </span>
                <p className="font-sans text-ink-muted italic">"{formData.message}"</p>
              </div>

              <button
                onClick={handleResetAndClose}
                className="px-6 py-2.5 rounded-xl bg-brand hover:bg-brand-dark text-white font-display text-xs font-bold uppercase tracking-wider transition-all shadow-xs cursor-pointer"
              >
                Fermer la fenêtre
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {/* Nom & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-display text-xs font-bold uppercase tracking-wider text-ink block mb-1">
                    Nom complet <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="ex: Amina Tazi"
                    className={`w-full h-11 px-3.5 rounded-xl bg-[#FAF9F6] text-ink font-sans text-sm border focus:outline-none transition-colors ${
                      errors.fullName
                        ? 'border-red-500 focus:ring-1 focus:ring-red-500'
                        : touched.fullName && formData.fullName
                        ? 'border-brand'
                        : 'border-sand-divider focus:border-brand focus:ring-1 focus:ring-brand'
                    }`}
                  />
                  {errors.fullName && (
                    <span className="text-[11px] font-sans text-red-600 font-medium block mt-1">
                      {errors.fullName}
                    </span>
                  )}
                </div>

                <div>
                  <label className="font-display text-xs font-bold uppercase tracking-wider text-ink block mb-1">
                    Adresse email <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="amina@exemple.ma"
                    className={`w-full h-11 px-3.5 rounded-xl bg-[#FAF9F6] text-ink font-sans text-sm border focus:outline-none transition-colors ${
                      errors.email
                        ? 'border-red-500 focus:ring-1 focus:ring-red-500'
                        : touched.email && formData.email
                        ? 'border-brand'
                        : 'border-sand-divider focus:border-brand focus:ring-1 focus:ring-brand'
                    }`}
                  />
                  {errors.email && (
                    <span className="text-[11px] font-sans text-red-600 font-medium block mt-1">
                      {errors.email}
                    </span>
                  )}
                </div>
              </div>

              {/* Téléphone & Objet */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-display text-xs font-bold uppercase tracking-wider text-ink block mb-1">
                    Téléphone (optionnel)
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+212 6 XX XX XX XX"
                    className="w-full h-11 px-3.5 rounded-xl bg-[#FAF9F6] text-ink font-sans text-sm border hairline-border focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                  />
                </div>

                <div>
                  <label className="font-display text-xs font-bold uppercase tracking-wider text-ink block mb-1">
                    Objet de la demande
                  </label>
                  <select
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    className="w-full h-11 px-3.5 rounded-xl bg-[#FAF9F6] text-ink font-sans text-sm border hairline-border focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                  >
                    <option value="Renseignement général">Renseignement général</option>
                    <option value="Création d'un club partenaire">Création d'un club partenaire</option>
                    <option value="Rejoindre en tant que guide référent">Rejoindre en tant que guide référent</option>
                    <option value="Signalement technique / Bug">Signalement technique / Bug</option>
                  </select>
                </div>
              </div>

              {/* Message */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-display text-xs font-bold uppercase tracking-wider text-ink">
                    Message <span className="text-red-600">*</span>
                  </label>
                  <span className="text-[11px] font-sans text-ink-muted">
                    {formData.message.length} / 15 car. min
                  </span>
                </div>
                <textarea
                  name="message"
                  rows={4}
                  value={formData.message}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Expliquez-nous votre besoin, votre ville ou vos envies de marche collective..."
                  className={`w-full p-3.5 rounded-xl bg-[#FAF9F6] text-ink font-sans text-sm border focus:outline-none transition-colors resize-none ${
                    errors.message
                      ? 'border-red-500 focus:ring-1 focus:ring-red-500'
                      : touched.message && formData.message
                      ? 'border-brand'
                      : 'border-sand-divider focus:border-brand focus:ring-1 focus:ring-brand'
                  }`}
                />
                {errors.message && (
                  <span className="text-[11px] font-sans text-red-600 font-medium block mt-1">
                    {errors.message}
                  </span>
                )}
              </div>

              {/* Submit CTA */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-12 rounded-xl bg-brand hover:bg-brand-dark text-white font-display text-xs uppercase tracking-[0.14em] font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <span className="material-symbols-outlined text-[18px] animate-spin">sync</span>
                      <span>Envoi en cours...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px]">send</span>
                      <span>Envoyer mon message</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
