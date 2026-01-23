import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { X } from 'lucide-react';

interface PolicyModalsProps {
  privacyOpen: boolean;
  termsOpen: boolean;
  onPrivacyOpenChange: (open: boolean) => void;
  onTermsOpenChange: (open: boolean) => void;
}

const PolicyModals = ({
  privacyOpen,
  termsOpen,
  onPrivacyOpenChange,
  onTermsOpenChange
}: PolicyModalsProps) => {
  return (
    <>
      {/* Privacy Policy Modal */}
      <Dialog open={privacyOpen} onOpenChange={onPrivacyOpenChange}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-ivory border-gold border-2 p-0">
          <div className="bg-luxury-gradient py-6 px-8 rounded-t-lg relative">
            <button 
              onClick={() => onPrivacyOpenChange(false)} 
              className="absolute right-4 top-4 p-1 rounded-full bg-gold/10 hover:bg-gold/20 transition-colors"
            >
              <X className="h-5 w-5 text-ivory" />
            </button>
            <DialogHeader className="mb-0">
              <DialogTitle className="text-3xl font-playfair text-gold font-semibold">Privacy Policy</DialogTitle>
              <DialogDescription className="text-ivory/80 mt-1">
                Last updated: June 15, 2024
              </DialogDescription>
            </DialogHeader>
          </div>
          
          <div className="space-y-6 text-charcoal/80 p-8">
            <section>
              <h3 className="text-xl font-playfair font-semibold text-charcoal mb-3 border-b border-gold/30 pb-2">1. Introduction</h3>
              <p className="text-charcoal/80">
                At Vintage Valley Resort, we respect your privacy and are committed to protecting your personal data. 
                This privacy policy will inform you about how we look after your personal data when you visit our website 
                and tell you about your privacy rights and how the law protects you.
              </p>
            </section>
            
            <section>
              <h3 className="text-xl font-playfair font-semibold text-charcoal mb-3 border-b border-gold/30 pb-2">2. The Data We Collect</h3>
              <p className="text-charcoal/80 mb-3">
                We may collect, use, store and transfer different kinds of personal data about you which we have grouped together as follows:
              </p>
              <ul className="list-disc pl-6 mt-2 space-y-2 text-charcoal/80">
                <li>Identity Data: includes first name, last name, username or similar identifier, title, date of birth.</li>
                <li>Contact Data: includes billing address, delivery address, email address and telephone numbers.</li>
                <li>Financial Data: includes bank account and payment card details.</li>
                <li>Transaction Data: includes details about payments to and from you and other details of products and services you have purchased from us.</li>
                <li>Technical Data: includes internet protocol (IP) address, your login data, browser type and version, time zone setting and location, browser plug-in types and versions, operating system and platform, and other technology on the devices you use to access this website.</li>
              </ul>
            </section>
            
            <section>
              <h3 className="text-xl font-playfair font-semibold text-charcoal mb-3 border-b border-gold/30 pb-2">3. How We Use Your Data</h3>
              <p className="text-charcoal/80 mb-3">
                We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:
              </p>
              <ul className="list-disc pl-6 mt-2 space-y-2 text-charcoal/80">
                <li>Where we need to perform the contract we are about to enter into or have entered into with you.</li>
                <li>Where it is necessary for our legitimate interests (or those of a third party) and your interests and fundamental rights do not override those interests.</li>
                <li>Where we need to comply with a legal obligation.</li>
              </ul>
            </section>
            
            <section>
              <h3 className="text-xl font-playfair font-semibold text-charcoal mb-3 border-b border-gold/30 pb-2">4. Data Security</h3>
              <p>
                We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used or accessed in an unauthorized way, altered or disclosed. In addition, we limit access to your personal data to those employees, agents, contractors and other third parties who have a business need to know.
              </p>
            </section>
            
            <section>
              <h3 className="text-xl font-playfair font-semibold text-charcoal mb-3 border-b border-gold/30 pb-2">5. Your Legal Rights</h3>
              <p className="text-charcoal/80 mb-3">
                Under certain circumstances, you have rights under data protection laws in relation to your personal data, including the right to:
              </p>
              <ul className="list-disc pl-6 mt-2 space-y-2 text-charcoal/80">
                <li>Request access to your personal data.</li>
                <li>Request correction of your personal data.</li>
                <li>Request erasure of your personal data.</li>
                <li>Object to processing of your personal data.</li>
                <li>Request restriction of processing your personal data.</li>
                <li>Request transfer of your personal data.</li>
                <li>Right to withdraw consent.</li>
              </ul>
            </section>
            
            <section>
              <h3 className="text-xl font-playfair font-semibold text-charcoal mb-3 border-b border-gold/30 pb-2">6. Contact Us</h3>
              <p className="text-charcoal/80 mb-3">
                If you have any questions about this privacy policy or our privacy practices, please contact us at:
              </p>
              <div className="mt-2 text-charcoal/80">
                <p><strong className="text-charcoal">Email:</strong> vintagevalleyresort@gmail.com</p>
                <p><strong className="text-charcoal">Phone:</strong> +91 9371179888</p>
                <p><strong className="text-charcoal">Address:</strong> Mumbai - Nashik Expy, opp. Parveen Industry, Talegaon, Igatpuri, Maharashtra 422402.</p>
              </div>
            </section>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Terms & Conditions Modal */}
      <Dialog open={termsOpen} onOpenChange={onTermsOpenChange}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-ivory border-gold border-2 p-0">
          <div className="bg-luxury-gradient py-6 px-8 rounded-t-lg relative">
            <button 
              onClick={() => onTermsOpenChange(false)} 
              className="absolute right-4 top-4 p-1 rounded-full bg-gold/10 hover:bg-gold/20 transition-colors"
            >
              <X className="h-5 w-5 text-ivory" />
            </button>
            <DialogHeader className="mb-0">
              <DialogTitle className="text-3xl font-playfair text-gold font-semibold">Terms & Conditions</DialogTitle>
              <DialogDescription className="text-ivory/80 mt-1">
                Last updated: June 15, 2024
              </DialogDescription>
            </DialogHeader>
          </div>
          
          <div className="space-y-6 text-charcoal/80 p-8">
            <section>
              <h3 className="text-xl font-playfair font-semibold text-charcoal mb-3 border-b border-gold/30 pb-2">1. Acceptance of Terms</h3>
              <p className="text-charcoal/80">
                By accessing and using the services of Vintage Valley Resort, you accept and agree to be bound by the terms and provisions of this agreement. If you do not agree to abide by the above, please do not use this service.
              </p>
            </section>
            
            <section>
              <h3 className="text-xl font-playfair font-semibold text-charcoal mb-3 border-b border-gold/30 pb-2">2. Reservation and Cancellation Policy</h3>
              <ul className="list-disc pl-6 mt-2 space-y-2 text-charcoal/80">
                <li>Reservations must be guaranteed with a valid credit card at the time of booking.</li>
                <li>Cancellations made 48 hours or more before the scheduled arrival date will receive a full refund.</li>
                <li>Cancellations made less than 48 hours before the scheduled arrival date will be charged for one night's stay.</li>
                
                <li>Early departures will be charged for the entire reserved stay.</li>
              </ul>
            </section>
            
            <section>
              <h3 className="text-xl font-playfair font-semibold text-charcoal mb-3 border-b border-gold/30 pb-2">3. Check-in and Check-out</h3>
              <ul className="list-disc pl-6 mt-2 space-y-2 text-charcoal/80">
                <li>Check-in time is 1:00 PM. Early check-in is subject to availability.</li>
                <li>Check-out time is 11:00 AM. Late check-out may result in additional charges.</li>
                <li>A valid government-issued photo ID is required at check-in.</li>
              </ul>
            </section>
            
            <section>
              <h3 className="text-xl font-playfair font-semibold text-charcoal mb-3 border-b border-gold/30 pb-2">4. Resort Rules</h3>
              <ul className="list-disc pl-6 mt-2 space-y-2 text-charcoal/80">
                <li>Smoking is prohibited in all indoor areas of the resort.</li>
                <li>Pets are not allowed unless specifically stated as a pet-friendly room.</li>
                <li>Quiet hours are from 10:00 PM to 7:00 AM.</li>
                <li>The resort is not responsible for any loss or damage to personal belongings.</li>
                <li>Guests are liable for any damage caused to resort property during their stay.</li>
              </ul>
            </section>
            
            <section>
              <h3 className="text-xl font-playfair font-semibold text-charcoal mb-3 border-b border-gold/30 pb-2">5. Child and Extra Person Policy</h3>
              <ul className="list-disc pl-6 mt-2 space-y-2 text-charcoal/80">
                <li>Children below 5 years of age stay free when using existing bedding.</li>
                <li>Children between 5 to 12 years are charged ₹1200 per night.</li>
                <li>Extra person charges (above 12 years) are ₹1500 per night.</li>
                <li>Maximum occupancy per room varies by room type.</li>
              </ul>
            </section>
            
            <section>
              <h3 className="text-xl font-playfair font-semibold text-charcoal mb-3 border-b border-gold/30 pb-2">6. Facility Usage</h3>
              <ul className="list-disc pl-6 mt-2 space-y-2 text-charcoal/80">
                <li>Use of resort facilities is at the guest's own risk.</li>
                <li>Children must be supervised at all times, especially in the pool area.</li>
                <li>The resort reserves the right to close any facility for maintenance without prior notice.</li>
                <li>Operating hours for facilities are subject to change.</li>
              </ul>
            </section>
            
            <section>
              <h3 className="text-xl font-playfair font-semibold text-charcoal mb-3 border-b border-gold/30 pb-2">7. Limitation of Liability</h3>
              <p className="text-charcoal/80">
                Vintage Valley Resort shall not be liable for any direct, indirect, incidental, special, or consequential damages resulting from the use or inability to use the services or for the cost of procurement of substitute services.
              </p>
            </section>
            
            <section>
              <h3 className="text-xl font-playfair font-semibold text-charcoal mb-3 border-b border-gold/30 pb-2">8. Governing Law</h3>
              <p className="text-charcoal/80">
                These terms and conditions are governed by and construed in accordance with the laws of India, and you irrevocably submit to the exclusive jurisdiction of the courts in Maharashtra, India.
              </p>
            </section>
            
            <section>
              <h3 className="text-xl font-playfair font-semibold text-charcoal mb-3 border-b border-gold/30 pb-2">9. Contact Information</h3>
              <p className="text-charcoal/80 mb-3">
                For questions or concerns regarding these terms and conditions, please contact us at:
              </p>
              <div className="mt-2 text-charcoal/80">
                <p><strong className="text-charcoal">Email:</strong> vintagevalleyresort@gmail.com</p>
                <p><strong className="text-charcoal">Phone:</strong> +91 9371179888</p>
                <p><strong className="text-charcoal">Address:</strong> Mumbai - Nashik Expy, opp. Parveen Industry, Talegaon, Igatpuri, Maharashtra 422402.</p>
              </div>
            </section>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PolicyModals;