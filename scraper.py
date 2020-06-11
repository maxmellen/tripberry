import requests
from loguru import logger
import os
import re

appKey = 'NtHtMn'

shaderts = 'export let names = {};'
prefix = """#version 100

// Original shader by {} on Shadertoy
// https://www.shadertoy.com/view/{}

precision highp float;
uniform vec2 u_resolution;
uniform float u_time;

#define iResolution u_resolution
#define iTime u_time
"""

suffix = """
void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}"""


def crawlShader(url):
    shaderID = url.split('/')[-1]
    answer = requests.get(f'https://www.shadertoy.com/api/v1/shaders/{shaderID}?key={appKey}')
    if answer.ok and "Error" not in answer.json().keys():
        return answer.json()
    else:
        print(f"Error fetching shader: {answer.text}")


def saveShader(shaderJson):
    shaderInfo = shaderJson['Shader']['info']
    shaderName = shaderInfo['name'].lower().replace(' ', "_")
    shaderName = re.sub('[^0-9a-zA-Z\-:_]', "", shaderName)

    code = prefix.format(shaderInfo['username'], shaderInfo['id']) + \
           shaderJson['Shader']['renderpass'][0]['code'] + \
           suffix

    with open(f'shaders/{shaderName}.frag', 'w') as file:
        file.write(code)

    return shaderName


def updateShaderList():
    shaderList = []
    for filename in os.listdir('shaders/'):
        if filename.endswith(".frag"):
            shaderList.append(filename.split('.')[0])

    shaderList = sorted(shaderList)

    with open(f'src/shaders.ts', 'w') as file:
        file.write(shaderts.format(shaderList))


@logger.catch
def workShader(url):
    shaderJson = crawlShader(url)
    shaderName = saveShader(shaderJson)
    updateShaderList()

    print(f"Shader {shaderName} added.\n\n")


if __name__ == "__main__":
    while True:
        url = input("Shadertoy link to add:\n")
        workShader(url)
