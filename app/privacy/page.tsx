'use client';

import Link from 'next/link';
import { useI18n } from '@/lib/i18n';
import BrandMark from '@/components/BrandMark';

const LAST_UPDATED = '2026-08-30';

export default function PrivacyPage() {
  const { locale } = useI18n();
  return locale === 'th' ? <Thai /> : <English />;
}

function Shell({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <div className="legal-page">
      <div className="legal-card">
        <Link href="/" className="brand" style={{ padding: 0, marginBottom: 20 }}>
          <BrandMark />
          <div className="brand-name">Bujo</div>
        </Link>
        <h1 className="auth-title" style={{ marginBottom: 4 }}>
          {title}
        </h1>
        <p className="muted" style={{ fontSize: 12.5, marginBottom: 24 }}>
          {updated}
        </p>
        {children}
      </div>
    </div>
  );
}

function English() {
  return (
    <Shell title="Privacy Policy" updated={`Last updated: ${LAST_UPDATED}`}>
      <p>
        This policy explains what Bujo ("the service") collects about you, why, and what rights you have over it.
        Bujo is a personal bullet-journal app; the operator running this instance is
        <strong> [fill in: operator name and contact email] </strong>
        — replace this placeholder before inviting real users, since Thailand's Personal Data Protection Act (PDPA)
        requires a data controller to be identifiable and reachable.
      </p>

      <h2>What we collect</h2>
      <ul>
        <li><strong>Account data:</strong> the email and name you register with, and a bcrypt hash of your password (never the password itself).</li>
        <li><strong>Journal content:</strong> whatever you write — entries, notes, and collections. This is private to your account; nobody but you (and, only for account administration, never for reading your entries, a site admin) can access it.</li>
        <li><strong>Technical data:</strong> your IP address, held only transiently in memory to enforce rate limits against abuse — it is not logged to persistent storage or linked to your account.</li>
        <li><strong>Session cookie:</strong> a single httpOnly cookie that keeps you signed in. It carries no tracking or advertising purpose.</li>
      </ul>

      <h2>Why we collect it</h2>
      <p>
        Strictly to run the service: to create and secure your account, to keep your journal private to you, and to
        keep the service available by preventing abuse (spam accounts, scripted flooding). We do not use your data
        for advertising, and we do not sell or share it with third parties.
      </p>

      <h2>How long we keep it</h2>
      <p>
        Your account and journal content are kept as long as your account exists. Deleting your account (from the
        sidebar, or by asking an admin) permanently removes your entries, collections, and account record. The
        database is also snapshotted periodically for disaster recovery; a deleted account may persist in a backup
        snapshot for up to roughly two weeks before that snapshot is rotated out.
      </p>

      <h2>Your rights</h2>
      <ul>
        <li><strong>Access</strong> — everything tied to your account is visible to you directly in the app.</li>
        <li><strong>Correction</strong> — edit any entry or collection at any time; contact the operator above for account-level detail changes not yet exposed in the UI (such as changing your registered email).</li>
        <li><strong>Erasure</strong> — delete your own account and all of its data at any time from the sidebar. No admin approval is required.</li>
        <li><strong>Portability</strong> — a machine-readable export of your data can be requested from the operator above.</li>
        <li><strong>Objection / restriction</strong> — contact the operator above with any concern about how your data is processed.</li>
      </ul>

      <h2>Security</h2>
      <p>
        Passwords are hashed with bcrypt and never stored or logged in plain text. Sessions use httpOnly,
        SameSite cookies so they can't be read by page scripts. Every journal entry and collection is scoped to
        its owning account at the database level — no user can read another user's content, and admins manage
        accounts only, never journal content.
      </p>

      <h2>Children</h2>
      <p>This service is not directed at children and is not knowingly used to collect data from them.</p>

      <h2>Changes</h2>
      <p>Any change to this policy will be posted on this page with an updated date above.</p>

      <p className="muted" style={{ fontSize: 12.5, marginTop: 24 }}>
        See also the <Link href="/terms">Terms of Service</Link>.
      </p>
    </Shell>
  );
}

function Thai() {
  return (
    <Shell title="นโยบายความเป็นส่วนตัว" updated={`อัปเดตล่าสุด: ${LAST_UPDATED}`}>
      <p>
        นโยบายนี้อธิบายว่า Bujo ("บริการ") เก็บข้อมูลอะไรเกี่ยวกับคุณ เพื่ออะไร และคุณมีสิทธิ์อะไรบ้าง Bujo
        เป็นแอปบันทึกส่วนตัวแบบ bullet journal ผู้ให้บริการที่ดูแลระบบนี้คือ
        <strong> [กรอกชื่อผู้ให้บริการและอีเมลติดต่อ] </strong>
        — โปรดแก้ไขข้อความนี้ก่อนเปิดให้ผู้ใช้จริงเข้าใช้งาน เนื่องจากพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล (PDPA)
        กำหนดให้ผู้ควบคุมข้อมูลต้องระบุตัวตนและติดต่อได้
      </p>

      <h2>ข้อมูลที่เราเก็บ</h2>
      <ul>
        <li><strong>ข้อมูลบัญชี:</strong> อีเมลและชื่อที่ใช้สมัคร และรหัสผ่านที่ผ่านการเข้ารหัสแบบ bcrypt (ไม่เก็บรหัสผ่านจริง)</li>
        <li><strong>เนื้อหาบันทึก:</strong> สิ่งที่คุณเขียน — รายการ โน้ต และคอลเลกชัน เป็นส่วนตัวเฉพาะบัญชีคุณ ไม่มีใครอื่นเข้าถึงได้ (แม้แต่แอดมิน ซึ่งจัดการเฉพาะบัญชี ไม่เข้าถึงเนื้อหาบันทึก)</li>
        <li><strong>ข้อมูลทางเทคนิค:</strong> IP address ที่เก็บไว้ชั่วคราวในหน่วยความจำเพื่อจำกัดอัตราการใช้งานป้องกันการโจมตีเท่านั้น ไม่ถูกบันทึกถาวรหรือผูกกับบัญชีคุณ</li>
        <li><strong>คุกกี้เซสชัน:</strong> คุกกี้ httpOnly หนึ่งตัวเพื่อคงสถานะการเข้าสู่ระบบ ไม่มีวัตถุประสงค์ติดตามหรือโฆษณา</li>
      </ul>

      <h2>เพราะเหตุใดเราจึงเก็บข้อมูล</h2>
      <p>
        เพื่อให้บริการทำงานได้เท่านั้น — สร้างและรักษาความปลอดภัยบัญชีคุณ รักษาความเป็นส่วนตัวของบันทึก
        และป้องกันการละเมิด (บัญชีสแปม การยิงคำขอจำนวนมาก) เราไม่ใช้ข้อมูลของคุณเพื่อโฆษณา และไม่ขายหรือแบ่งปันให้บุคคลที่สาม
      </p>

      <h2>ระยะเวลาที่เก็บข้อมูล</h2>
      <p>
        บัญชีและเนื้อหาบันทึกของคุณจะถูกเก็บไว้ตราบเท่าที่บัญชียังอยู่ การลบบัญชี (จากแถบด้านข้าง หรือแจ้งแอดมิน)
        จะลบรายการ คอลเลกชัน และบัญชีของคุณอย่างถาวร ฐานข้อมูลมีการสำรองข้อมูลเป็นระยะเพื่อกู้คืนกรณีเกิดปัญหา
        บัญชีที่ถูกลบอาจยังคงอยู่ในไฟล์สำรองได้นานสุดประมาณสองสัปดาห์ก่อนถูกลบออกตามรอบ
      </p>

      <h2>สิทธิ์ของคุณ</h2>
      <ul>
        <li><strong>เข้าถึงข้อมูล</strong> — ทุกอย่างที่เกี่ยวกับบัญชีคุณ คุณเห็นได้โดยตรงในแอป</li>
        <li><strong>แก้ไขข้อมูล</strong> — แก้ไขรายการหรือคอลเลกชันได้ตลอดเวลา ส่วนการเปลี่ยนอีเมลที่ลงทะเบียนที่ยังไม่มีในหน้า UI ให้ติดต่อผู้ให้บริการด้านบน</li>
        <li><strong>ลบข้อมูล</strong> — ลบบัญชีและข้อมูลทั้งหมดของคุณได้เองตลอดเวลาจากแถบด้านข้าง ไม่ต้องรอแอดมินอนุมัติ</li>
        <li><strong>โอนย้ายข้อมูล</strong> — สามารถขอไฟล์ข้อมูลของคุณในรูปแบบที่อ่านได้จากผู้ให้บริการด้านบน</li>
        <li><strong>คัดค้าน/จำกัดการประมวลผล</strong> — ติดต่อผู้ให้บริการด้านบนหากมีข้อกังวลเกี่ยวกับการใช้ข้อมูลของคุณ</li>
      </ul>

      <h2>ความปลอดภัย</h2>
      <p>
        รหัสผ่านถูกเข้ารหัสด้วย bcrypt และไม่เคยถูกเก็บหรือบันทึกเป็นข้อความธรรมดา เซสชันใช้คุกกี้แบบ httpOnly และ
        SameSite เพื่อไม่ให้สคริปต์บนหน้าเว็บอ่านได้ ทุกรายการและคอลเลกชันถูกผูกกับบัญชีเจ้าของในระดับฐานข้อมูล
        ผู้ใช้คนอื่นอ่านเนื้อหาของคุณไม่ได้ และแอดมินจัดการเฉพาะบัญชี ไม่เข้าถึงเนื้อหาบันทึก
      </p>

      <h2>เด็กและเยาวชน</h2>
      <p>บริการนี้ไม่ได้มุ่งเป้าไปที่เด็ก และไม่ได้เก็บข้อมูลจากเด็กโดยเจตนา</p>

      <h2>การเปลี่ยนแปลง</h2>
      <p>หากมีการเปลี่ยนแปลงนโยบายนี้ จะประกาศไว้ในหน้านี้พร้อมวันที่อัปเดตด้านบน</p>

      <p className="muted" style={{ fontSize: 12.5, marginTop: 24 }}>
        ดู <Link href="/terms">ข้อกำหนดการให้บริการ</Link> ด้วย
      </p>
    </Shell>
  );
}
