interface Props {
    readonly seoTitle: string;
    readonly seoDescription?: string;
}

export default function Metadata({ seoTitle, seoDescription = "Just API Doc description" }: Props) {
    return (
        <>
            <title>{seoTitle}</title>
            <meta name="description" content={seoDescription} />
        </>
    );
}