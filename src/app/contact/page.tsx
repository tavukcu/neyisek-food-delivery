'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Send, 
  MessageCircle,
  Clock,
  Loader2,
  CheckCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import BackToHomeButton from '@/components/BackToHomeButton';

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      toast.error('Lütfen tüm zorunlu alanları doldurun');
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate form submission
      await new Promise(resolve => setTimeout(resolve, 2000));
      setIsSubmitted(true);
      toast.success('Mesajınız başarıyla gönderildi! En kısa sürede size dönüş yapacağız.');
    } catch (error) {
      toast.error('Mesaj gönderilirken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main>
      {/* Header */}
      <Header />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary-600 to-primary-800 text-white py-16">
        <div className="container-responsive text-center">
          <MessageCircle className="h-16 w-16 mx-auto mb-6 opacity-90" />
          <h1 className="text-4xl font-bold mb-4">
            İletişim
          </h1>
          <p className="text-xl opacity-90 max-w-2xl mx-auto mb-6">
            Size nasıl yardımcı olabiliriz? Sorularınız için bizimle iletişime geçin.
          </p>
          <BackToHomeButton variant="secondary" />
        </div>
      </section>

      {/* Contact Content */}
      <section className="py-12 bg-gray-50">
        <div className="container-responsive">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Contact Information */}
            <div className="lg:col-span-1">
              <div className="card p-6 h-fit">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  İletişim Bilgileri
                </h2>
                
                <div className="space-y-4">
                  {/* Location */}
                  <div className="flex items-start space-x-3">
                    <MapPin className="h-5 w-5 text-primary-600 mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-gray-900">Adres</h3>
                      <p className="text-gray-600">
                        Ahmetli/Manisa/TÜRKİYE
                      </p>
                    </div>
                  </div>

                  {/* Email */}
                  <div className="flex items-start space-x-3">
                    <Mail className="h-5 w-5 text-primary-600 mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-gray-900">E-posta</h3>
                      <p className="text-gray-600">
                        info@neyisek.com
                      </p>
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="flex items-start space-x-3">
                    <Phone className="h-5 w-5 text-primary-600 mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-gray-900">Telefon</h3>
                      <p className="text-gray-600">
                        0555 123 45 67
                      </p>
                    </div>
                  </div>

                  {/* Working Hours */}
                  <div className="flex items-start space-x-3">
                    <Clock className="h-5 w-5 text-primary-600 mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-gray-900">Çalışma Saatleri</h3>
                      <div className="text-gray-600 space-y-1">
                        <p>Pazartesi - Cuma: 09:00 - 18:00</p>
                        <p>Cumartesi: 09:00 - 15:00</p>
                        <p>Pazar: Kapalı</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Support */}
                <div className="mt-8 p-4 bg-primary-50 rounded-lg">
                  <h3 className="font-semibold text-primary-900 mb-2">
                    Hızlı Destek
                  </h3>
                  <p className="text-primary-700 text-sm mb-3">
                    Acil durumlar için WhatsApp hattımızdan 7/24 destek alabilirsiniz.
                  </p>
                  <a
                    href="https://wa.me/905551234567"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary text-sm"
                  >
                    WhatsApp ile İletişim
                  </a>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <div className="card p-6">
                {isSubmitted ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-green-600 mb-2">
                      Mesajınız Gönderildi!
                    </h2>
                    <p className="text-gray-600 mb-6">
                      Mesajınız için teşekkür ederiz. En kısa sürede size dönüş yapacağız.
                    </p>
                    <button
                      onClick={() => {
                        setIsSubmitted(false);
                        setFormData({ name: '', email: '', subject: '', message: '' });
                      }}
                      className="btn-outline"
                    >
                      Yeni Mesaj Gönder
                    </button>
                  </div>
                ) : (
                  <>
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">
                      Bizimle İletişime Geçin
                    </h2>
                    
                    <form onSubmit={handleSubmit} className="space-y-6">
                      {/* Name */}
                      <div>
                        <label htmlFor="name" className="form-label">
                          Adınız Soyadınız *
                        </label>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          className="form-input"
                          placeholder="Adınız ve soyadınız"
                          required
                        />
                      </div>

                      {/* Email */}
                      <div>
                        <label htmlFor="email" className="form-label">
                          E-posta Adresiniz *
                        </label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          className="form-input"
                          placeholder="ornek@email.com"
                          required
                        />
                      </div>

                      {/* Subject */}
                      <div>
                        <label htmlFor="subject" className="form-label">
                          Konu
                        </label>
                        <select
                          id="subject"
                          name="subject"
                          value={formData.subject}
                          onChange={handleInputChange}
                          className="form-input"
                        >
                          <option value="">Konu seçin</option>
                          <option value="general">Genel Bilgi</option>
                          <option value="restaurant">Restoran Başvurusu</option>
                          <option value="order">Sipariş Sorunu</option>
                          <option value="technical">Teknik Destek</option>
                          <option value="partnership">İş Ortaklığı</option>
                          <option value="other">Diğer</option>
                        </select>
                      </div>

                      {/* Message */}
                      <div>
                        <label htmlFor="message" className="form-label">
                          Mesajınız *
                        </label>
                        <textarea
                          id="message"
                          name="message"
                          value={formData.message}
                          onChange={handleInputChange}
                          rows={6}
                          className="form-input"
                          placeholder="Mesajınızı buraya yazın..."
                          required
                        />
                      </div>

                      {/* Submit Button */}
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="h-5 w-5 animate-spin" />
                            Gönderiliyor...
                          </>
                        ) : (
                          <>
                            <Send className="h-5 w-5" />
                            Mesaj Gönder
                          </>
                        )}
                      </button>
                    </form>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="bg-white py-12">
        <div className="container-responsive">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Sık Sorulan Sorular
            </h2>
            <p className="text-gray-600">
              Size yardımcı olabilecek cevapları burada bulabilirsiniz
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-4">
            {[
              {
                question: "Restoran başvurum ne kadar sürede değerlendirilir?",
                answer: "Restoran başvuruları genellikle 1-3 iş günü içinde değerlendirilir. Başvuru durumunuz e-posta ile bildirilir."
              },
              {
                question: "Komisyon oranı nedir?",
                answer: "Platform komisyon oranı %9'dur. Bu oran her başarılı siparişten alınır."
              },
              {
                question: "Siparişimi nasıl takip edebilirim?",
                answer: "Sipariş verdikten sonra, sipariş durumunuzu hesabınızdan takip edebilirsiniz. Ayrıca SMS ile bilgilendirme yapılır."
              },
              {
                question: "Ödeme yaparken sorun yaşıyorum, ne yapmalıyım?",
                answer: "Ödeme sorunları için teknik destek hattımızdan yardım alabilir veya WhatsApp üzerinden bizimle iletişime geçebilirsiniz."
              }
            ].map((faq, index) => (
              <details key={index} className="card p-4">
                <summary className="font-semibold text-gray-900 cursor-pointer">
                  {faq.question}
                </summary>
                <p className="mt-2 text-gray-600">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
} 