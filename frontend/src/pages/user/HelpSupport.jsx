import { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, Send, Mail, Phone, Book, CheckCircle2 } from 'lucide-react';
import API from '../../api/axios';

const FAQS = [
  {
    q: 'How do I submit a complaint?',
    a: 'Click on "Create Complaint" in the sidebar. Fill in the title, description, select a category and priority, and attach any supporting files. Submit the form when ready.'
  },
  {
    q: 'How long does it take to resolve a complaint?',
    a: 'Resolution time depends on the nature and priority of the complaint. High-priority complaints are typically addressed within 2-3 business days, while standard ones may take up to 7 days.'
  },
  {
    q: 'How can I track my complaint status?',
    a: 'Use the "Track Complaint" page in the sidebar. Enter your Complaint ID or a keyword from your complaint title to view the current status and full timeline.'
  },
  {
    q: 'Can I update a complaint after submitting it?',
    a: 'You can add comments to an existing complaint through the Complaint Details page. For major changes, please contact support.'
  },
  {
    q: 'What does "SLA Breached" mean?',
    a: 'SLA (Service Level Agreement) breach means the complaint has exceeded the expected resolution time. It will be automatically escalated to the department head for urgent action.'
  },
  {
    q: 'How do I give feedback on a resolved complaint?',
    a: 'Visit the "Feedback & Ratings" page. All your resolved and closed complaints will be listed there. You can submit a star rating and written comment for each.'
  },
  {
    q: 'Can I download my complaint history?',
    a: 'Yes! Visit the "Download Reports" page. You can export your full complaint summary as a PDF or Excel file.'
  },
  {
    q: 'How do I change my password?',
    a: 'Go to "My Profile" in the sidebar, click "Edit Profile", then scroll down to the Change Password section.'
  },
];

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`border rounded-xl overflow-hidden transition-all ${open ? 'border-teal-200' : 'border-gray-100'}`}>
      <button onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between px-5 py-4 text-left transition-colors ${open ? 'bg-teal-50/50' : 'bg-white hover:bg-gray-50'}`}>
        <span className={`text-sm font-semibold ${open ? 'text-[#0F766E]' : 'text-gray-800'}`}>{q}</span>
        {open ? <ChevronUp size={16} className="text-[#0F766E] flex-shrink-0" /> : <ChevronDown size={16} className="text-gray-400 flex-shrink-0" />}
      </button>
      {open && (
        <div className="px-5 pb-4 bg-white">
          <p className="text-sm text-gray-600 leading-relaxed">{a}</p>
        </div>
      )}
    </div>
  );
}

export default function HelpSupport() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  const handleSend = async (e) => {
    e.preventDefault();
    try {
      await API.post('/support', { name, email, message });
      setSent(true);
      setName(''); setEmail(''); setMessage('');
      setTimeout(() => setSent(false), 3000);
    } catch (err) {
      alert('Failed to send message. Please try again.');
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Help & Support</h2>
        <p className="text-gray-500 text-sm mt-1">Find answers to common questions or reach out to our support team.</p>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: Book, label: 'User Guide', desc: 'Step-by-step instructions', color: 'bg-blue-50 text-blue-600' },
          { icon: Mail, label: 'Email Support', desc: 'support@cgms.gov.in', color: 'bg-teal-50 text-teal-600' },
          { icon: Phone, label: 'Helpline', desc: '1800-XXX-XXXX (Toll Free)', color: 'bg-green-50 text-green-600' },
        ].map(({ icon: Icon, label, desc, color }) => (
          <div key={label} className={`rounded-2xl border border-gray-100 bg-white shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-shadow cursor-pointer`}>
            <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center flex-shrink-0`}>
              <Icon size={22} />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">{label}</p>
              <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* FAQ */}
      <div className="space-y-4">
        <h3 className="font-bold text-gray-800 flex items-center gap-2">
          <HelpCircle size={18} className="text-[#0F766E]" /> Frequently Asked Questions
        </h3>
        <div className="space-y-2">
          {FAQS.map((faq, i) => <FAQItem key={i} q={faq.q} a={faq.a} />)}
        </div>
      </div>

      {/* Contact Form */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <h3 className="font-bold text-gray-800 flex items-center gap-2">
          <Send size={16} className="text-[#0F766E]" /> Contact Support
        </h3>
        {sent ? (
          <div className="py-8 text-center">
            <CheckCircle2 size={40} className="text-green-500 mx-auto mb-3" />
            <p className="font-semibold text-gray-900">Message Sent!</p>
            <p className="text-sm text-gray-500 mt-1">Our support team will get back to you within 24 hours.</p>
          </div>
        ) : (
          <form onSubmit={handleSend} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-600">Your Name</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} required
                  placeholder="Enter your name"
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#14B8A6]" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-600">Email Address</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  placeholder="Enter your email"
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#14B8A6]" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-600">Your Message</label>
              <textarea rows={4} value={message} onChange={e => setMessage(e.target.value)} required
                placeholder="Describe your issue or question..."
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-[#14B8A6]" />
            </div>
            <button type="submit"
              className="w-full py-3 bg-gradient-to-r from-[#0F766E] to-[#14B8A6] text-white text-sm font-bold rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
              <Send size={15} /> Send Message
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
