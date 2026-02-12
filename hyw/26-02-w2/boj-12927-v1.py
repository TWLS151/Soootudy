lights = []
lights += input()
# print(lights)
def switch(pos):
    if lights[pos] == 'Y':
        lights[pos] = 'N'
    else:
        lights[pos] = 'Y'

cnt = 0
for i in range(len(lights)):    

    if lights[i] == 'Y':
        connected = 1
        cnt+=1
        while connected*(i+1) <= len(lights):
            switch(connected*(i+1)-1)
            connected+=1
print(cnt)