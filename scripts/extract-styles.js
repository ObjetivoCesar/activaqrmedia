const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const casesDir = 'C:\\tmp\\awesome-nano-banana\\cases';
const actualDir = fs.existsSync('/tmp/awesome-nano-banana/cases') ? '/tmp/awesome-nano-banana/cases' : casesDir;

const outputDir = path.join(__dirname, '..', 'public', 'video-styles');
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

const styles = [];

function getCategory(title, prompt) {
    const t = (title + ' ' + prompt).toLowerCase();
    if (t.includes('3d') || t.includes('chibi') || t.includes('pixar') || t.includes('ghibli') || t.includes('anime') || t.includes('cartoon') || t.includes('q版')) {
        return '3D & Cartoon';
    }
    if (t.includes('satirical') || t.includes('poster') || t.includes('art') || t.includes('illustration') || t.includes('comic') || t.includes('漫画')) {
        return 'Satirical & Art';
    }
    if (t.includes('photorealistic') || t.includes('photography') || t.includes('portrait') || t.includes('realistic') || t.includes('real-world')) {
        return 'Photo-realistic';
    }
    return 'Creative Pixels';
}

for (let i = 1; i <= 100; i++) {
    const casePath = path.join(actualDir, i.toString());
    const ymlPath = path.join(casePath, 'case.yml');

    if (fs.existsSync(ymlPath)) {
        try {
            const fileContents = fs.readFileSync(ymlPath, 'utf8');
            const data = yaml.load(fileContents);

            if (data && data.image && data.prompt_en) {
                const sourceImagePath = path.join(casePath, data.image);
                const destImageName = `style_${i}_${data.image}`;
                const destImagePath = path.join(outputDir, destImageName);

                if (fs.existsSync(sourceImagePath)) {
                    fs.copyFileSync(sourceImagePath, destImagePath);

                    const title = data.title_en || data.title;
                    const prompt = data.prompt_en;

                    styles.push({
                        id: `style_${i}`,
                        title: title,
                        category: getCategory(title, prompt),
                        prompt: prompt,
                        image: `/video-styles/${destImageName}`
                    });
                }
            }
        } catch (e) {
            console.error(`Error processing case ${i}:`, e);
        }
    }
}

fs.writeFileSync(path.join(outputDir, 'styles.json'), JSON.stringify(styles, null, 2));
console.log(`Extracted ${styles.length} styles and categorized them.`);
