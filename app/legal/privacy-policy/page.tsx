"use client";

import React from "react";
import { SpecksAnimation } from "../../../components/SpecksAnimation";
import CaladNavbar from "../../../components/landing/CaladNavbar";
import CaladFooter from "../../../components/landing/CaladFooter";
import Link from "next/link";

export default function PrivacyPolicyPage() {
  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-[#7f8ee2] z-10">
      {/* Background Animation */}
      <SpecksAnimation />
      <div className="pt-[120px] relative z-10">
        {/* Main Content */}
        <CaladNavbar />
        
        <div className="container mx-auto max-w-4xl px-6 py-4">
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-8 shadow-lg">
            <h1 className="text-3xl font-bold text-white mb-6">Privacy Policy</h1>
            <div className="prose prose-invert prose-lg max-w-none text-white/90">
              <p>Last Updated: April 08, 2025</p>
              
              <h2 className="text-2xl font-bold text-white mt-8 mb-4">INTRODUCTION</h2>
              <p>
                Aldeo Innovations LLC ("our" "we" or "us") respects the privacy and is committed to protect the personal information
                of our Users ("user," "you," your" or "yours") when you visit or use
                <Link href="https://cal.ad" className="text-white hover:text-[#ffd125]" target="_blank" rel="noopener noreferrer"> cal.ad</Link>
                &nbsp;(the "App"), a software service provided by Aldeo Innovations LLC.
              </p>
              <p>
                We provide our App and Services (hereinafter collectively, either "App" or "Services") to you as
                under the following privacy policy (the "Policy").
              </p>
              
              <h2 className="text-2xl font-bold text-white mt-8 mb-4">Personal Information We Collect</h2>
              <p>
                In order to keep the App functional, we must process information about you
                to operate, improve, modify, customize, support and market our services.
                If you do not agree with this, then you can update/delete your personal information through
                <Link href="https://cal.ad/app/chat/settings" className="text-white hover:text-[#ffd125]" target="_blank" rel="noopener noreferrer"> our app settings page</Link>, where you can delete your account entirely, which will remove all your data from our systems and automatically terminate any authorization access granted to Google services or permissions.
              </p>
              <p>
                The type of information that we collect depends on how you use our App and
                Services. We require certain information to deliver to you, our services,
                and without this, we will not be able to provide such services to you. Our
                Services have optional features, which, if used by you, require us to
                collect additional information to provide such features. You will be
                notified of such collection, as appropriate. If you choose not to provide
                the information needed to use a feature, you will be unable to use the
                feature. Please carefully read the following to understand what information
                we may collect:
              </p>
              <p>
                When you use the App or register to the App, we may ask you to provide
                certain information, including Email, Name or Surname. We
                will also collect or otherwise ask you to provide additional information that you
                provide us, such as your profile details, pictures and/or any other texts, images, videos or
                information that you may upload on the App and/or provide to the App.
              </p>
              <p>
                Your financial information when you make purchases on the App. We collect
                financial information when you make a
                purchase on the <Link href="https://stripe.com/privacy" className="text-white hover:text-[#ffd125]" target="_blank" rel="noopener noreferrer">Stripe</Link>
                or other payment providers.
              </p>
              <p>
                We may also collect details about other social networks and linked
                accounts such as <Link href="https://policies.google.com/privacy?hl=en-US" className="text-white hover:text-[#ffd125]" target="_blank" rel="noopener noreferrer">Google</Link> and
                also information about your communications with us as well as communication
                with other users of our App, and we receive certain information, which they provide.
              </p>
              <p>
                We also collect information while you access, browse, view or otherwise
                use the App. In other words, when you access the App we are aware of your
                usage of the App, and gather, collect and record the information relating
                to such usage, including geo-location information, IP address, device and
                connection information, browser information and web-log information, phone
                book and contacts, and all communications recorded by Users through the
                App. We use that information to enhance user experience, personalize your
                browsing experience as well as monitor the App for preventing fraud and
                inappropriate content or behavior. We collect texts, information, pictures,
                videos and/or any data that you may upload on the app. We also collect
                supplemental information obtained from third parties such as demographic
                and navigation data, if applicable. We combine your personal information
                with information we collect automatically or obtain from other companies
                and use it to improve and personalize our services, content and advertising
                and/or to prevent fraud.
              </p>
              <p>
                All of the preceding is collected, as permitted by applicable laws relevant
                to your jurisdiction.
              </p>

              <h2 className="text-2xl font-bold text-white mt-8 mb-4">How Do We Collect Personal Information?</h2>
              <p><strong>Information provided by you.</strong></p>
              <p>
                You directly provide us with most of the information we collect. You do
                this by filling out the registration details on the App, linking accounts
                of other social networks to your <Link href="https://cal.ad" className="text-white hover:text-[#ffd125]" target="_blank" rel="noopener noreferrer">cal.ad</Link>
                account (a software service of Aldeo Innovations LLC), completing application forms, as well as by posting and sharing
                additional information voluntarily.
              </p>
              <p><strong>Information we collect when you use the App.</strong></p>
              <p>
                We collect technical information indirectly and automatically through our
                systems. This information includes logging your operating system, software
                configuration, Internet Protocol (IP) address and use of cookies (cookies
                are small files sent from us to your computer and sometimes back). Cookies
                ultimately help us improve your navigation and ease of use of our App.
                Should you require additional information about how we may use Cookies to
                improve the services we provide, please visit our Cookie Policy.
              </p>
              <p><strong>Information we collect from other sources.</strong></p>
              <p>
                We may receive information from third party vendors and/or other
                commercially available sources, such as:
              </p>
              <ul className="list-disc pl-5 space-y-2 marker:text-white">
                <li>
                  Third party vendors who provide us data to supplement the information
                  we collect about you, in accordance with applicable laws. For example,
                  we receive information from advertising and marketing partners in order
                  to manage and measure our campaigns as well as from enrichment service
                  providers to enhance, modify and personalize your experience of the
                  App.
                </li>
                <li>
                  If you link, connect, or login to your to your social media accounts
                  with us, with a third-party service (e.g. <Link href="https://policies.google.com/privacy?hl=en-US" className="text-white hover:text-[#ffd125]" target="_blank" rel="noopener noreferrer">Google</Link>),
                  we will receive certain profile information about you from your social media provider.
                  The profile information we receive may vary depending on the social media provider concerned, but will
                  often include your name, email address, friends list, profile picture as well as other information you choose to make
                  public on such social media platform. Please note that we do not control, and are not responsible for, other uses of your personal information
                  by your third-party social media provider. We recommend that you review their privacy notice to understand how
                  they collect, use and share your personal information, and how you can set your privacy preferences on their sites and apps.
                </li>
              </ul>

              <h2 className="text-2xl font-bold text-white mt-8 mb-4">How We Use Collected Personal Information</h2>
              <p>
                All processing of your personal information will always be justified by a
                "lawful ground" for processing, where relevant under applicable laws. In
                the majority of cases, processing will be justified on the basis that:
              </p>
              <ul className="list-disc pl-5 space-y-2 marker:text-white">
                <li>
                  you, or in the case you are below the age of 16 or the age of legal
                  adulthood if different in your country, your parent or guardian has
                  provided consent for us to use your personal information for a specific
                  purpose;
                </li>
                <li>
                  the use of your personal information is necessary to perform a contract
                  or take reasonable steps to enter into a contract with you
                  (e.g. to provide you with agreements or services which you have
                  purchased);
                </li>
                <li>
                  the processing is necessary to comply with a relevant legal obligation
                  or regulatory obligation that you and/or we have (e.g. fraud
                  prevention); or
                </li>
                <li>
                  the processing is necessary to support our legitimate interests as a
                  business (e.g. to improve our services to you), subject to your
                  interests and fundamental rights and provided it is conducted at all
                  times in a way that is proportionate.
                </li>
              </ul>
              <p>We will use your personal information for the following purposes:</p>
              <ul className="list-disc pl-5 space-y-2 marker:text-white">
                <li>To create user accounts.</li>
                <li>To provide the core functionality of our App, including calendaring, scheduling, and organizational features.</li>
                <li>To process your natural language instructions and create calendar events accordingly.</li>
                <li>To personalize your experience with relevant features and content.</li>
                <li>To maintain the security and integrity of our App.</li>
                <li>To communicate with you about your account, our services, and important updates.</li>
              </ul>

              <h2 className="text-2xl font-bold text-white mt-8 mb-4">How Long Do We Retain Your Personal Information?</h2>
              <p>
                We retain personal information only for as long as is required to fulfil
                the purpose for which it was collected and unless otherwise stated for a
                period of: as long as the user has an account with us.
              </p>
              <p>
                Please note that some circumstances, we will retain your personal information
                for longer periods of time. We will retain personal information for the
                following purposes:
              </p>
              <ul className="list-disc pl-5 space-y-2 marker:text-white">
                <li>
                  as long as it is necessary and relevant for our operations,
                  e.g. as long as is necessary to provide services, etc.; and
                </li>
                <li>
                  in relation to personal information to comply with applicable laws,
                  prevent fraud, troubleshoot problems, assist with any investigation,
                  enforce our App terms and take other actions as permitted by law.
                </li>
              </ul>

              <h2 className="text-2xl font-bold text-white mt-8 mb-4">Children under the legal Age of adulthood</h2>
              <p>
                Our services are not directed to children under the age of thirteen,
                or any as such age relevant to Applicable Laws in your jurisdiction, and we
                do not knowingly collect personal information from children under the age
                of thirteen, or sixteen, through our Services. We encourage parents and
                legal guardians to help enforce our Privacy Notice by instructing children
                under the age of thirteen not to download or use our online services.
                Should we learn we have collected or received personal information from a
                child under 13 or any such age relevant to Applicable Laws in your
                jurisdiction, we shall delete that personal information immediately and if
                we shall have a reasonable doubt that the consent given is not truthful
                regarding the age of the user, we reserve ourselves the right to
                immediately suspend the access to the App giving notice of the reasons. If
                you believe we might have any information from or about a child under 13 or
                16, or if you are a parent or guardian concerned that we may have collected
                information of your child, please contact us immediately at
                noah@aldeoinnovations.com.
              </p>

              <h2 className="text-2xl font-bold text-white mt-8 mb-4">Sharing Personal Information with Third Parties</h2>
              <p>
                We do not sell or rent your personal information to third parties for their
                marketing purposes.
              </p>
              <p>
                We share your personal information with third parties as under:
              </p>
              <ul className="list-disc pl-5 space-y-2 marker:text-white">
                <li>
                  We share personal information with service providers that provide us
                  with services for the purpose of operating the App and opening and
                  operating your account. Consistent with applicable legal
                  requirements, we take commercially reasonable steps to require third
                  parties to adequately safeguard your personal information and only
                  process it in accordance with our instructions;
                </li>
                <li>
                  We share personal information to law enforcement agencies, public
                  authorities or other parties, if we believe we are required to do so by
                  law, or that doing so is reasonably necessary to comply with our legal
                  obligations;
                </li>
                <li>
                  We share personal information with payment processors, fraud detection
                  agencies and similar third parties for the purpose of facilitating
                  payments done via the App and securing the App and protecting it
                  against fraud or other liabilities;
                </li>
                <li>
                  We also may share limited personal information with such
                  social media platforms and marketing partners, such as Facebook,
                  Twitter and Google, to promote our services. Such features and third
                  party services collect certain information about you and may set a
                  cookie to enable their functionality. Such third party features are
                  governed by their privacy policies and under their terms and
                  conditions.
                </li>
              </ul>

              <p>
                Personal information will also be disclosed if we go through a business
                transition such as a merger, sale, transfer of all or a portion of Aldeo Innovations LLC's
                assets, acquisition, bankruptcy or similar event. In the event that we sell any business or
                assets, we will disclose your data to the prospective buyer. If we or
                substantially all of our assets are acquired by a third party,
                information held by us about our users will be one of the transferred assets. For Google API data, we will obtain your explicit consent before transferring such data as part of any business transition.
              </p>

              <p>
                Please note, when you publish your information and/or share your data with
                other Users, we try to maintain the standards of all users, but we do not
                take responsibility over the actions of other users.
              </p>

              <h2 className="text-2xl font-bold text-white mt-8 mb-4">Where We Store Your Personal Information</h2>
              <p>
                We may store your data manually or electronically. Any data stored electronically will be stored in secure
                servers, and any data stored manually will be stored in our premises within the United States.
                Unfortunately, the transmission of information via the internet is not completely secure. Although we will do
                our best to protect your personal data, we cannot guarantee the security of data transmitted to us and any transmission is at your own risk.
              </p>

              <h2 className="text-2xl font-bold text-white mt-8 mb-4">Cookies and Local Storage</h2>
              <p>
                Our App utilizes cookies and similar technologies, such as local storage (collectively referred to as "cookies"), to ensure proper functionality, facilitate user authentication, and support our analytical efforts. These technologies are small data files stored on your device when you use our App.
              </p>
              <p>
                <strong>Essential Cookies:</strong> Some cookies are strictly necessary for the operation of our App. These include cookies used for authenticating you as a user, maintaining your session, and ensuring the security and integrity of our services. Without these cookies, certain features of the App may not function correctly.
              </p>
              <p>
                <strong>Analytics Technologies:</strong> We and our third-party service providers may also use cookies and similar technologies to collect information about your interaction with our App for analytics purposes. This is further detailed in the "Analytics and Usage Information" section of this Policy.
              </p>
              <p>
                You can typically manage your cookie preferences through your web browser settings. However, please note that disabling essential cookies may impact your ability to use our App. For more general information about cookies and how to manage them, you can visit resources like <Link href="https://allaboutcookies.org" className="text-white hover:text-[#ffd125]" target="_blank" rel="noopener noreferrer">www.allaboutcookies.org</Link>.
              </p>

              <h2 className="text-2xl font-bold text-white mt-8 mb-4">Do Not Track</h2>
              <p>
                Do Not Track (DNT) is a privacy preference that users can set in some web browsers, allowing users to opt out of tracking by the web and online services. Since we do not use cookies for tracking or marketing purposes, and only use essential authentication cookies, DNT signals do not affect the functionality of our App.
              </p>
              <p>
                At this time, our App does not specifically respond to Do Not Track beacons sent by browser plugins, but this does not impact your privacy as we do not engage in the kind of tracking that DNT is designed to prevent.
              </p>

              <h2 className="text-2xl font-bold text-white mt-8 mb-4">Analytics and Usage Information</h2>
              <p>
                To improve and optimize our App and services, we utilize third-party analytics service providers, such as PostHog. These providers help us understand how users engage with our App by collecting information about your usage patterns.
              </p>
              <p>
                The information collected may include, but is not limited to, details about the features you use, how you navigate through the App, general interaction data, and other statistical information related to your use of our services. This data is processed in an aggregated or de-identified manner where possible.
              </p>
              <p>
                These analytics service providers may use cookies and other tracking technologies to collect and analyze this information on our behalf. The data gathered is used for internal purposes, such as to monitor and analyze the use of our App, enhance its functionality, and better tailor our content and design to our users' needs.
              </p>
              <p>
                We do not use this information to personally identify you without your consent, nor do we sell data collected through our analytics providers to other third parties for their own marketing purposes. The use of such analytics services is aimed at improving the overall user experience and the services we offer.
              </p>
              <p>
                For further information about how these analytics providers handle your information, you may refer to their respective privacy policies. If you have questions about our use of analytics, please contact us using the details provided in the "CONTACT US" section.
              </p>

              <h2 className="text-2xl font-bold text-white mt-8 mb-4">Disclaimers</h2>
              <p><strong>Ads and External Links</strong></p>
              <p>
                Please note that the App may contains links to third party Apps and
                advertisements, and if you link to a third party App from the App, any data
                you provide to that App and any use of that data by the third party are not
                under the control of Aldeo Innovations LLC and are not
                subject to this Policy. You should consult the privacy policies of each App
                you visit. This Policy applies solely to personal information collected by
                our App. If you upload content, including personal information, to a social
                network and then tag the App, your submission will be subject to that
                social network's terms of use and privacy policy, even where you post on an
                official cal.ad (a service of Aldeo Innovations LLC) page on the social
                network. We do not have control over these terms of use and privacy
                policies and have not reviewed their adequacy. You should therefore review
                these before submitting any personal information.
              </p>
              <p><strong>Incorrect Contents</strong></p>
              <p>
                We take reasonable steps to ensure the accuracy of the information provide
                on the App and on the external link in this policy listed. However, the
                information is provided "as is" without any warranty of guarantee of any
                kind. Under no circumstance should you rely on the accuracy of information
                given on the App.
              </p>
              <p>
                We take no responsibility or liability for the accuracy, content,
                completeness, reliability or legality of the information and contents
                contained on this App.
              </p>

              <h2 className="text-2xl font-bold text-white mt-8 mb-4">Security</h2>
              <p>
                We maintain reasonable administrative, technical and physical safeguards in
                an effort to protect against unauthorized access, use, modification and
                disclosure of personal information in our custody and control, including
                only providing access to personal information to employees and authorized
                service providers who require such information for the purposes described
                in this Privacy Policy.
              </p>

              <h2 className="text-2xl font-bold text-white mt-8 mb-4">Google API Services and User Data</h2>
              <p>
                Google Sign-In is the only authentication method available for our App, and Google API Services are required for the App to perform its core functionality as an AI calendar assistant. When you use our App, we request access to certain Google user data through Google API Services, specifically Google Calendar data and user profile information. We adhere strictly to the <Link href="https://developers.google.com/terms/api-services-user-data-policy" className="text-white hover:text-[#ffd125]" target="_blank" rel="noopener noreferrer">Google API Services User Data Policy</Link> in our handling of this data.
              </p>

              <h3 className="text-xl font-semibold text-white mt-6 mb-3">What Google Data We Request and Why</h3>
              <p>We request access to the following Google data:</p>
              <ul className="list-disc pl-5 space-y-2 marker:text-white">
                <li><strong>Google Calendar data:</strong> To create, read, update, and delete calendar events on your behalf based on your instructions</li>
                <li><strong>User profile information:</strong> To personalize your experience and properly identify your account</li>
              </ul>
              <p>
                This access is essential for providing cal.ad's core functionality as an AI calendar assistant that helps you create and manage calendar events using natural language, process emails, and handle attachments automatically.
              </p>

              <h3 className="text-xl font-semibold text-white mt-6 mb-3">Limited Use of Google User Data</h3>
              <p>Our use of data obtained from Google Calendar APIs strictly adheres to Google's Limited Use requirements. We only use this data to provide or improve user-facing features that are prominent in our application's user interface.</p>
              
              <p>For Google Calendar data specifically, we will never use your data:</p>
              <ul className="list-disc pl-5 space-y-2 marker:text-white">
                <li>For surveillance purposes</li>
                <li>To sell to third parties such as advertising platforms, data brokers, or information resellers</li>
                <li>For advertising or marketing purposes, including retargeting or personalized/interest-based advertising</li>
                <li>To determine credit-worthiness or for lending purposes</li>
                <li>For any purpose not explicitly disclosed to you at the time of collection</li>
                <li>To train our own machine learning models using your Google Calendar data</li>
              </ul>
              
              <h3 className="text-xl font-semibold text-white mt-6 mb-3">Human Access to Your Data</h3>
              <p>We do not allow humans to read your Google Calendar data, except in the following limited circumstances:</p>
              <ul className="list-disc pl-5 space-y-2 marker:text-white">
                <li>With your explicit affirmative agreement to view specific data, such as for customer support purposes</li>
                <li>When necessary for security purposes (e.g., investigating bugs or abuse)</li>
                <li>When necessary to comply with applicable law</li>
                <li>When the data is aggregated and used for internal operations in accordance with applicable privacy laws</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mt-6 mb-3">Third-Party Service Providers Processing Google Calendar API Data</h3>
              <p>
                To provide our application's core functionality, your Google Calendar API data may be processed by the following third-party service providers:
              </p>
              <ul className="list-disc pl-5 space-y-2 marker:text-white">
                <li>
                  <strong>Vercel:</strong> Hosts our application infrastructure and processes Google Calendar API calls necessary for the operation of our Services. Vercel processes your data solely as required to facilitate the delivery of our Services and in accordance with applicable data protection laws.
                </li>
                <li>
                  <strong>Supabase:</strong> As an infrastructure provider, Supabase enables a core user-facing feature of our App - the web interface for managing calendar events with AI chat. Supabase provides data storage services for conversation history which may contain references to your calendar data. Retaining this conversation history is integral to providing continuity in your AI interactions. All stored data is subject to appropriate security measures and access controls in compliance with applicable data protection regulations.
                </li>
                <li>
                  <strong>Sinch Email:</strong> As an infrastructure provider, Sinch Email enables a core user-facing feature of our App - the ability to create and manage calendar events via email communication with our AI agent. Google Calendar API data may be included in email correspondence with you when processing your calendar-related requests. Sinch Email processes this data solely for the purpose of facilitating this essential functionality and in accordance with applicable data protection regulations.
                </li>
                <li>
                  <strong>AI Service Providers:</strong> We engage Google Vertex AI Platform and OpenAI Platform as processors to analyze natural language requests related to calendar functionality. These processors receive only the minimum data necessary to fulfill your specific requests, such as creating or modifying calendar events based on your instructions. These providers are contractually obligated to process your data solely for the purpose of providing the requested service and in accordance with our instructions.
                </li>
              </ul>
              
              <p>
                The transfer of your Google Calendar API data to these service providers is strictly limited to what is necessary to provide the user-facing features prominently displayed in our application's interface. We maintain appropriate data processing agreements with these providers that require them to implement reasonable security measures and process your data solely in accordance with our documented instructions.
              </p>

              <p>
                In addition to the aforementioned service providers, we may also transfer Google Calendar API data in the following limited circumstances:
              </p>
              <ul className="list-disc pl-5 space-y-2 marker:text-white">
                <li>For security purposes (including but not limited to investigating potential abuse or unauthorized access);</li>
                <li>To comply with applicable laws, regulations, legal processes, or enforceable governmental requests;</li>
                <li>As part of a corporate transaction such as a merger, acquisition, or sale of assets, provided that we first obtain your explicit prior consent for the transfer of Google Calendar API data.</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mt-6 mb-3">Transparency and Control</h3>
              <p>You always maintain control over your Google Calendar data:</p>
              <ul className="list-disc pl-5 space-y-2 marker:text-white">
                <li>You can review the specific calendar data our App can access through your Google account settings</li>
                <li>You can revoke our access to your Google data at any time, via the Google Account Settings</li>
                <li>You can delete specific calendar data directly through Google Calendar</li>
                <li>You can request a copy of all your data stored in our systems</li>
                <li>You can completely delete your account and all associated data, including Google Calendar data, by using the "Delete Account" button on the <Link href="https://cal.ad/app/chat/settings" className="text-white hover:text-[#ffd125]" target="_blank" rel="noopener noreferrer">cal.ad settings page</Link>, which will also automatically terminate all access authorizations to Google services</li>
              </ul>


              <h2 className="text-2xl font-bold text-white mt-8 mb-4">CONTACT US</h2>
              <p>
                For any questions or queries regarding this Privacy Policy, please feel free to contact us:
                <Link href="mailto:noah@aldeoinnovations.com" className="text-white hover:text-[#ffd125]" target="_blank" rel="noopener noreferrer"> noah@aldeoinnovations.com</Link>
              </p>

              <Link href="/" className="inline-block mt-8 text-white hover:text-[#ffd125] font-medium" target="_blank" rel="noopener noreferrer">
                ← Back to Home
              </Link>
            </div>
          </div>
        </div>
        
        <CaladFooter />
      </div>
    </div>
  );
} 