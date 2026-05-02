import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    padding: 56,
    backgroundColor: "#f8fafc",
    color: "#0f172a",
    fontFamily: "Helvetica",
  },
  border: {
    flex: 1,
    border: "4 solid #1e3a5f",
    padding: 32,
    backgroundColor: "white",
  },
  brand: {
    fontSize: 14,
    color: "#2563eb",
    letterSpacing: 3,
    marginBottom: 32,
    textAlign: "center",
    fontFamily: "Helvetica-Bold",
  },
  title: {
    fontSize: 36,
    textAlign: "center",
    marginBottom: 32,
    color: "#1e3a5f",
    fontFamily: "Helvetica-Bold",
  },
  body: {
    fontSize: 14,
    lineHeight: 1.6,
    textAlign: "center",
    color: "#334155",
  },
  recipient: {
    fontSize: 28,
    marginTop: 24,
    marginBottom: 16,
    textAlign: "center",
    color: "#0f172a",
    fontFamily: "Helvetica-Bold",
  },
  courseTitle: {
    fontSize: 18,
    marginTop: 16,
    textAlign: "center",
    color: "#1e3a5f",
    fontFamily: "Helvetica-Bold",
  },
  footer: {
    marginTop: "auto",
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 11,
    color: "#475569",
  },
});

type Props = {
  studentName: string;
  courseTitle: string;
  instructorName: string;
  serialNo: string;
  issuedAt: Date;
};

export async function renderCertificatePdf(props: Props): Promise<Buffer> {
  const doc = (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.border}>
          <Text style={styles.brand}>LINGUACLASS</Text>
          <Text style={styles.title}>Certificate of Completion</Text>

          <Text style={styles.body}>This certificate is presented to</Text>
          <Text style={styles.recipient}>{props.studentName}</Text>

          <Text style={styles.body}>
            for successfully completing the course
          </Text>
          <Text style={styles.courseTitle}>{props.courseTitle}</Text>

          <Text style={[styles.body, { marginTop: 24 }]}>
            Instructor: {props.instructorName}
          </Text>

          <View style={styles.footer}>
            <Text>S/N: {props.serialNo}</Text>
            <Text>
              Issued at {props.issuedAt.toISOString().slice(0, 10)}
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  );

  return await renderToBuffer(doc);
}
