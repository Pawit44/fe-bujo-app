'use client';

import Link from 'next/link';
import { useI18n } from '@/lib/i18n';
import BrandMark from '@/components/BrandMark';

const LAST_UPDATED = '2026-08-30';

export default function TermsPage() {
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
    <Shell title="Terms of Service" updated={`Last updated: ${LAST_UPDATED}`}>
      <p>By creating an account you agree to these terms.</p>

      <h2>About jodtask</h2>
      <p>
        jodtask (running here as Bujo) is a personal side project, built for learning, practicing software
        development, and personal use — not for commercial operation or profit of any kind.
      </p>
      <p>
        The service is provided "as is," with no guarantee of accuracy, completeness, or continuous availability.
        The developer reserves the right to improve, change, suspend, or discontinue it at any time without prior
        notice, since this is a project maintained by one person in their spare time.
      </p>
      <p>
        The developer is not liable for any damages, direct or indirect, arising from using the service or from its
        interruption — including lost or inaccessible data. Keep your own backup of anything that matters to you.
      </p>
      <p>
        Using this service is voluntary, and it comes with the understanding that this is an experimental, personal
        project that may have technical issues. Found a bug, or have a suggestion? Reach out at{' '}
        <a href="mailto:pawit.ch@gmail.com">pawit.ch@gmail.com</a>.
      </p>

      <h2>The service</h2>
      <p>
        Bujo is a personal bullet-journal tool. It's provided "as is," without warranty of any kind — there's no
        guarantee of uptime, and features may change.
      </p>

      <h2>Your account</h2>
      <ul>
        <li>You're responsible for keeping your password confidential and for all activity under your account.</li>
        <li>One account per person; don't create accounts to abuse, spam, or automate against the service.</li>
        <li>Fair-use limits apply to how many entries and collections an account can hold, enforced automatically so the service stays usable for everyone.</li>
      </ul>

      <h2>Your content</h2>
      <p>
        You own what you write. We don't claim any rights to your journal content beyond what's needed to store and
        display it back to you. Don't use the service to store or share content that's illegal, or that infringes
        someone else's rights.
      </p>

      <h2>Acceptable use</h2>
      <p>
        Don't attempt to bypass rate limits or quotas, scrape the service, probe it for vulnerabilities without
        authorization, or interfere with other accounts. Accounts found doing so may be suspended or deleted.
      </p>

      <h2>Termination</h2>
      <p>
        You can delete your own account at any time — see the sidebar. We may suspend or remove an account that
        violates these terms.
      </p>

      <h2>Liability</h2>
      <p>
        This is a small, self-hosted personal tool. To the extent permitted by law, the operator isn't liable for
        indirect or consequential damages arising from your use of it. Keep your own copies of anything critical.
      </p>

      <h2>Changes</h2>
      <p>Any change to these terms will be posted on this page with an updated date above.</p>

      <p className="muted" style={{ fontSize: 12.5, marginTop: 24 }}>
        See also the <Link href="/privacy">Privacy Policy</Link>.
      </p>
    </Shell>
  );
}

function Thai() {
  return (
    <Shell title="ข้อกำหนดการให้บริการ" updated={`อัปเดตล่าสุด: ${LAST_UPDATED}`}>
      <p>การสร้างบัญชีถือว่าคุณยอมรับข้อกำหนดนี้</p>

      <h2>เกี่ยวกับ jodtask</h2>
      <p>
        jodtask (ที่เปิดให้ใช้งานในชื่อ Bujo) เป็นโครงการส่วนบุคคล (personal side project) ที่พัฒนาขึ้นเพื่อการเรียนรู้
        ฝึกฝนทักษะการพัฒนาซอฟต์แวร์ และใช้งานส่วนตัว ไม่ได้มีเจตนาดำเนินการในเชิงพาณิชย์หรือแสวงหาผลกำไรแต่อย่างใด
      </p>
      <p>
        บริการนี้ให้ใช้งาน "ตามสภาพที่เป็นอยู่" (as-is) โดยไม่มีการรับประกันความถูกต้อง ความสมบูรณ์ หรือความพร้อมใช้งานตลอดเวลา
        ผู้พัฒนาขอสงวนสิทธิ์ในการปรับปรุง แก้ไข ระงับ หรือยกเลิกการให้บริการได้ตลอดเวลาโดยไม่จำเป็นต้องแจ้งล่วงหน้า
        เนื่องจากเป็นโครงการที่ดูแลโดยบุคคลคนเดียวในเวลาว่าง
      </p>
      <p>
        ผู้พัฒนาไม่รับผิดชอบต่อความเสียหายใด ๆ ไม่ว่าทางตรงหรือทางอ้อม ที่อาจเกิดขึ้นจากการใช้งานหรือการหยุดชะงักของบริการ
        รวมถึงกรณีข้อมูลสูญหายหรือเข้าถึงไม่ได้ ผู้ใช้งานควรสำรองข้อมูลสำคัญของตนเองไว้เสมอ
      </p>
      <p>
        ผู้ใช้งานตกลงใช้บริการนี้ด้วยความสมัครใจของตนเอง และรับทราบว่านี่คือโครงการทดลอง/ส่วนตัวที่อาจมีข้อบกพร่องทางเทคนิคเกิดขึ้นได้
        หากพบปัญหาหรือมีข้อเสนอแนะ สามารถติดต่อได้ที่ <a href="mailto:pawit.ch@gmail.com">pawit.ch@gmail.com</a>
      </p>

      <h2>เกี่ยวกับบริการ</h2>
      <p>
        Bujo คือเครื่องมือบันทึกส่วนตัวแบบ bullet journal ให้บริการ "ตามสภาพที่เป็นอยู่" ไม่มีการรับประกันใดๆ
        รวมถึงไม่รับประกันว่าระบบจะพร้อมใช้งานตลอดเวลา และฟีเจอร์อาจมีการเปลี่ยนแปลง
      </p>

      <h2>บัญชีของคุณ</h2>
      <ul>
        <li>คุณต้องรับผิดชอบในการเก็บรหัสผ่านเป็นความลับ และกิจกรรมทั้งหมดที่เกิดขึ้นภายใต้บัญชีของคุณ</li>
        <li>หนึ่งบัญชีต่อหนึ่งคน ห้ามสร้างบัญชีเพื่อละเมิด สแปม หรือใช้บอทโจมตีระบบ</li>
        <li>มีการจำกัดจำนวนรายการและคอลเลกชันต่อบัญชีตามการใช้งานที่เหมาะสม เพื่อให้บริการใช้งานได้ดีสำหรับทุกคน</li>
      </ul>

      <h2>เนื้อหาของคุณ</h2>
      <p>
        คุณเป็นเจ้าของสิ่งที่คุณเขียน เราไม่อ้างสิทธิ์ใดๆ ในเนื้อหาบันทึกของคุณ นอกเหนือจากที่จำเป็นต่อการจัดเก็บ
        และแสดงผลกลับให้คุณ ห้ามใช้บริการนี้เก็บหรือเผยแพร่เนื้อหาที่ผิดกฎหมายหรือละเมิดสิทธิ์ผู้อื่น
      </p>

      <h2>การใช้งานที่เหมาะสม</h2>
      <p>
        ห้ามพยายามหลีกเลี่ยงการจำกัดอัตราการใช้งานหรือโควตา ห้าม scrape ระบบ ห้ามทดสอบช่องโหว่โดยไม่ได้รับอนุญาต
        และห้ามรบกวนบัญชีผู้ใช้อื่น บัญชีที่พบว่าทำเช่นนี้อาจถูกระงับหรือลบ
      </p>

      <h2>การยกเลิก</h2>
      <p>คุณสามารถลบบัญชีของตัวเองได้ตลอดเวลาจากแถบด้านข้าง เราอาจระงับหรือลบบัญชีที่ละเมิดข้อกำหนดนี้</p>

      <h2>ความรับผิด</h2>
      <p>
        นี่คือเครื่องมือส่วนตัวขนาดเล็กที่ดูแลเอง ภายในขอบเขตที่กฎหมายอนุญาต ผู้ให้บริการไม่รับผิดต่อความเสียหาย
        ทางอ้อมหรือที่ตามมาจากการใช้งานของคุณ โปรดเก็บสำเนาข้อมูลสำคัญไว้เอง
      </p>

      <h2>การเปลี่ยนแปลง</h2>
      <p>หากมีการเปลี่ยนแปลงข้อกำหนดนี้ จะประกาศไว้ในหน้านี้พร้อมวันที่อัปเดตด้านบน</p>

      <p className="muted" style={{ fontSize: 12.5, marginTop: 24 }}>
        ดู <Link href="/privacy">นโยบายความเป็นส่วนตัว</Link> ด้วย
      </p>
    </Shell>
  );
}
