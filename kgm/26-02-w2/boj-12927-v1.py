light = list(input())
cnt = 0                 # 전구를 바꾼 횟수를 저장
n = len(light)          
# Y가 보일때마다 스위치를 켜서 전구의 상태를 바꿈
for i in range(n):                      
    if light[i] == "Y":
        cnt += 1
        # 인덱스이므로 간격은 인덱스 +1
        # Y는 N으로 N은 Y로 변경
        for z in range(i,n,i+1):
            if light[z] == "Y":
                light[z] = "N"
            elif light[z] == "N":
                light [z] = "Y"
# light에 Y가 남아있으면 -1 아니면 cnt 출력
if "Y" in light: 
    print(-1)
else:
    print(cnt)